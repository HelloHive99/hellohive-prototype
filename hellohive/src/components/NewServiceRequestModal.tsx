'use client';

import { useState, useEffect } from 'react';
import { X, Mic, MicOff, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { properties, vendors } from '@/data/seed-data';
import { SAMPLE_TRANSCRIPT, PARSED_FIELDS } from '@/data/sample-voice-intake';
import type { WorkOrderPriority, VendorCategory } from '@/data/seed-data';

interface NewServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewServiceRequestModal({ isOpen, onClose }: NewServiceRequestModalProps) {
  const { currentUser, addWorkOrder, addActivityFeedItem, getAllWorkOrders } = useUser();

  // State
  const [transcriptionToggle, setTranscriptionToggle] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [displayedTranscript, setDisplayedTranscript] = useState('');
  const [showFields, setShowFields] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Typing animation effect
  useEffect(() => {
    if (transcript && displayedTranscript.length < transcript.length) {
      const timer = setTimeout(() => {
        setDisplayedTranscript(transcript.slice(0, displayedTranscript.length + 1));
      }, 30); // 30ms per character
      return () => clearTimeout(timer);
    } else if (transcript && displayedTranscript.length === transcript.length) {
      // Typing complete, show fields after brief delay
      const timer = setTimeout(() => setShowFields(true), 500);
      return () => clearTimeout(timer);
    }
  }, [transcript, displayedTranscript]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setDisplayedTranscript('');
      setShowFields(false);
      setIsRecording(false);
      setIsTranscribing(false);
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }
  }, [isOpen, mediaRecorder]);

  const useSampleClip = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
    setDisplayedTranscript('');
  };

  const startRecording = async () => {
    if (!transcriptionToggle) {
      // Toggle is OFF, use simulated transcript
      useSampleClip();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // MIME selection rule
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        // Send to transcribe API
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (data.fallback || !data.text) {
            // Fallback to simulated transcript
            setTranscript(SAMPLE_TRANSCRIPT);
          } else {
            setTranscript(data.text);
          }
        } catch (error) {
          // Fallback on any error
          setTranscript(SAMPLE_TRANSCRIPT);
        } finally {
          setIsTranscribing(false);
          setDisplayedTranscript('');
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording(false);
        }
      }, 30000);
    } catch (error) {
      // MediaRecorder failed, use simulated transcript
      useSampleClip();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const createWorkOrder = () => {
    // Generate new work order ID
    const allWorkOrders = getAllWorkOrders();
    const maxId = Math.max(...allWorkOrders.map((wo) => {
      const match = wo.id.match(/WO-2026-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }));
    const newId = `WO-2026-${String(maxId + 1).padStart(4, '0')}`;

    // Create work order
    const now = new Date().toISOString();
    const newWorkOrder = {
      id: newId,
      title: PARSED_FIELDS.title,
      description: transcript,
      propertyId: PARSED_FIELDS.propertyId,
      spaceId: PARSED_FIELDS.spaceId,
      assetId: PARSED_FIELDS.assetId,
      status: 'open' as const,
      priority: PARSED_FIELDS.priority,
      category: PARSED_FIELDS.category,
      assignedVendorId: undefined,
      createdBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
    };

    addWorkOrder(newWorkOrder);

    // Add activity feed entry
    const activityId = `activity-${Date.now()}`;
    addActivityFeedItem({
      id: activityId,
      workOrderId: newId,
      message: `Created by ${currentUser.name}`,
      timestamp: now,
      userId: currentUser.id,
    });

    // Close modal
    onClose();
  };

  // Get parsed field display values
  const property = properties.find((p) => p.id === PARSED_FIELDS.propertyId);
  const space = property?.spaces.find((s) => s.id === PARSED_FIELDS.spaceId);
  const asset = space?.assets.find((a) => a.id === PARSED_FIELDS.assetId);
  const vendor = vendors.find((v) => v.id === PARSED_FIELDS.suggestedVendorId);

  const priorityBadgeVariant: Record<WorkOrderPriority, 'completed' | 'in-progress' | 'open' | 'overdue' | 'pending'> = {
    low: 'completed',
    medium: 'pending',
    high: 'overdue',
    urgent: 'overdue',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#F5F0EB]">
                New Service Request
              </h2>
              <p className="text-sm text-[#4A4953] mt-1">
                Record a voice memo or use the sample clip
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#4A4953] hover:text-[#F5F0EB] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Transcription Toggle */}
          <div className="flex items-center justify-between mb-6 p-4 bg-[#1E1520] rounded-lg">
            <span className="text-sm font-medium text-[#F5F0EB]">
              Live Transcription (Whisper)
            </span>
            <button
              onClick={() => setTranscriptionToggle(!transcriptionToggle)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                transcriptionToggle ? 'bg-[#F5C518]' : 'bg-[#4A4953]'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-[#150F16] rounded-full transition-transform ${
                  transcriptionToggle ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Recording Controls */}
          <div className="flex flex-col items-center gap-4 mb-8">
            {/* Mic Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                isRecording
                  ? 'bg-[#E74C3C] hover:bg-[#E74C3C]/90'
                  : 'bg-[#F5C518] hover:bg-[#F5C518]/90'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8 text-[#150F16]" />
              ) : (
                <Mic className="w-8 h-8 text-[#150F16]" />
              )}
            </button>

            {/* Use Sample Clip Button */}
            <button
              onClick={useSampleClip}
              disabled={isRecording || isTranscribing}
              className="text-[#4A4953] hover:text-[#F5F0EB] text-sm font-medium transition-colors disabled:opacity-50"
            >
              Use Sample Clip
            </button>
          </div>

          {/* Transcribing State */}
          {isTranscribing && (
            <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-[#1E1520] rounded-lg">
              <Loader2 className="w-5 h-5 text-[#F5C518] animate-spin" />
              <span className="text-sm text-[#F5F0EB]">Transcribing...</span>
            </div>
          )}

          {/* Transcript Display */}
          {displayedTranscript && (
            <div className="mb-6 p-4 bg-[#1E1520] rounded-lg">
              <p className="text-sm font-medium text-[#4A4953] uppercase tracking-wider mb-2">
                Transcript
              </p>
              <p className="text-sm text-[#F5F0EB]">
                {displayedTranscript}
                {displayedTranscript.length < transcript.length && (
                  <span className="inline-block w-1 h-4 bg-[#F5C518] ml-1 animate-pulse" />
                )}
              </p>
            </div>
          )}

          {/* Parsed Fields */}
          {showFields && (
            <div className="space-y-4 mb-6 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#1E1520] rounded-lg">
                  <p className="text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
                    Property
                  </p>
                  <p className="text-sm text-[#F5F0EB] font-medium">{property?.name}</p>
                </div>

                <div className="p-4 bg-[#1E1520] rounded-lg">
                  <p className="text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
                    Space
                  </p>
                  <p className="text-sm text-[#F5F0EB] font-medium">{space?.name}</p>
                </div>

                <div className="p-4 bg-[#1E1520] rounded-lg">
                  <p className="text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
                    Asset
                  </p>
                  <p className="text-sm text-[#F5F0EB] font-medium">{asset?.name}</p>
                </div>

                <div className="p-4 bg-[#1E1520] rounded-lg">
                  <p className="text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
                    Priority
                  </p>
                  <Badge variant={priorityBadgeVariant[PARSED_FIELDS.priority]}>
                    {PARSED_FIELDS.priority}
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-[#1E1520] rounded-lg">
                <p className="text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
                  Category
                </p>
                <p className="text-sm text-[#F5F0EB] font-medium">{PARSED_FIELDS.category} / Critical Infrastructure</p>
              </div>

              <div className="p-4 bg-[#1E1520] rounded-lg">
                <p className="text-xs font-medium text-[#4A4953] uppercase tracking-wider mb-2">
                  Suggested Vendor
                </p>
                <p className="text-sm text-[#F5F0EB] font-medium">{vendor?.name}</p>
                <p className="text-xs text-[#4A4953] mt-1">
                  {vendor?.slaCompliance.toFixed(1)}% SLA • {vendor?.avgResponseTime.toFixed(1)} hr avg response
                </p>
              </div>
            </div>
          )}

          {/* Create Work Order Button */}
          {showFields && (
            <div className="flex justify-end">
              <Button onClick={createWorkOrder}>
                Create Work Order
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
