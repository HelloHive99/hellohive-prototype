'use client';

import { useState, useEffect } from 'react';
import { X, Mic, MicOff, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { properties, vendors } from '@/data/seed-data';
import { SAMPLE_TRANSCRIPT, PARSED_FIELDS } from '@/data/sample-voice-intake';
import type { WorkOrderPriority, VendorCategory } from '@/data/seed-data';
import type { ParsedFields } from '@/app/api/transcribe/route';

interface NewServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ConfidenceBadge({ extracted }: { extracted: boolean }) {
  return extracted ? (
    <span className="text-[10px] text-green-400 font-medium tracking-wide">✓ AI</span>
  ) : (
    <span className="text-[10px] text-amber-400 font-medium tracking-wide">⚠ Review</span>
  );
}

// ── Null fallback ──────────────────────────────────────────────────────────

const NULL_PARSED: ParsedFields = {
  title: null,
  priority: null,
  category: null,
  propertyId: null,
  spaceId: null,
  suggestedVendorId: null,
};

// ── Component ──────────────────────────────────────────────────────────────

export function NewServiceRequestModal({ isOpen, onClose }: NewServiceRequestModalProps) {
  const { currentUser, addWorkOrder, addActivityFeedItem, getAllWorkOrders, getAllVendors, getTechniciansByVendor } = useUser();

  // Mode toggle
  const [createMode, setCreateMode] = useState<'voice' | 'manual'>('voice');

  // Voice recording state
  const [transcriptionToggle, setTranscriptionToggle] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [displayedTranscript, setDisplayedTranscript] = useState('');
  const [showFields, setShowFields] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Voice form fields (editable, pre-populated by AI)
  const [voiceTitle, setVoiceTitle] = useState('');
  const [voicePriority, setVoicePriority] = useState<WorkOrderPriority>('medium');
  const [voiceCategory, setVoiceCategory] = useState<VendorCategory>('MEP');
  const [voicePropertyId, setVoicePropertyId] = useState('');
  const [voiceSpaceId, setVoiceSpaceId] = useState('');
  const [voiceVendorId, setVoiceVendorId] = useState('');
  // Which fields Claude extracted with confidence (for ✓/⚠ badges)
  const [aiExtracted, setAiExtracted] = useState<Set<string>>(new Set());

  // Manual entry form fields
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualPriority, setManualPriority] = useState<WorkOrderPriority>('medium');
  const [manualPropertyId, setManualPropertyId] = useState('');
  const [manualSpaceId, setManualSpaceId] = useState('');
  const [manualAssetId, setManualAssetId] = useState('');
  const [manualCategory, setManualCategory] = useState<VendorCategory>('MEP');
  const [manualVendorId, setManualVendorId] = useState('');
  const [manualTechnicianId, setManualTechnicianId] = useState('');
  const [manualDueDate, setManualDueDate] = useState('');
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});

  const allVendors = getAllVendors();
  const allAssets = properties.flatMap((p) => p.spaces.flatMap((s) => s.assets));

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Populate voice fields from static PARSED_FIELDS (demo / fallback mode) */
  const applyStaticFields = () => {
    setVoiceTitle(PARSED_FIELDS.title);
    setVoicePriority(PARSED_FIELDS.priority);
    setVoiceCategory(PARSED_FIELDS.category);
    setVoicePropertyId(PARSED_FIELDS.propertyId);
    setVoiceSpaceId(PARSED_FIELDS.spaceId);
    setVoiceVendorId(PARSED_FIELDS.suggestedVendorId);
    setAiExtracted(new Set(['title', 'priority', 'category', 'property', 'space', 'vendor']));
  };

  /** Populate voice fields from real Claude extraction */
  const applyParsedFields = (parsed: ParsedFields) => {
    const extracted = new Set<string>();

    setVoiceTitle(parsed.title ?? '');
    if (parsed.title) extracted.add('title');

    setVoicePriority(parsed.priority ?? 'medium');
    if (parsed.priority) extracted.add('priority');

    setVoiceCategory((parsed.category as VendorCategory) ?? 'MEP');
    if (parsed.category) extracted.add('category');

    setVoicePropertyId(parsed.propertyId ?? '');
    if (parsed.propertyId) extracted.add('property');

    // Only keep spaceId if parent property also matched
    setVoiceSpaceId(parsed.propertyId && parsed.spaceId ? parsed.spaceId : '');
    if (parsed.propertyId && parsed.spaceId) extracted.add('space');

    setVoiceVendorId(parsed.suggestedVendorId ?? '');
    if (parsed.suggestedVendorId) extracted.add('vendor');

    setAiExtracted(extracted);
  };

  const resetVoiceFields = () => {
    setVoiceTitle('');
    setVoicePriority('medium');
    setVoiceCategory('MEP');
    setVoicePropertyId('');
    setVoiceSpaceId('');
    setVoiceVendorId('');
    setAiExtracted(new Set());
  };

  // ── Typing animation ──────────────────────────────────────────────────────

  useEffect(() => {
    if (transcript && displayedTranscript.length < transcript.length) {
      const timer = setTimeout(() => {
        setDisplayedTranscript(transcript.slice(0, displayedTranscript.length + 1));
      }, 30);
      return () => clearTimeout(timer);
    } else if (transcript && displayedTranscript.length === transcript.length) {
      const timer = setTimeout(() => setShowFields(true), 500);
      return () => clearTimeout(timer);
    }
  }, [transcript, displayedTranscript]);

  // ── Reset on close ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setDisplayedTranscript('');
      setShowFields(false);
      setIsRecording(false);
      setIsTranscribing(false);
      resetVoiceFields();
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }
  }, [isOpen, mediaRecorder]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sample clip (demo) ────────────────────────────────────────────────────

  const useSampleClip = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
    setDisplayedTranscript('');
    applyStaticFields();
  };

  // ── Manual form helpers ───────────────────────────────────────────────────

  const resetManualForm = () => {
    setManualTitle('');
    setManualDescription('');
    setManualPriority('medium');
    setManualPropertyId('');
    setManualSpaceId('');
    setManualAssetId('');
    setManualCategory('MEP');
    setManualVendorId('');
    setManualTechnicianId('');
    setManualDueDate('');
    setManualErrors({});
  };

  const handleModeChange = (mode: 'voice' | 'manual') => {
    setCreateMode(mode);
    if (mode === 'manual') resetManualForm();
  };

  const validateManualForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!manualTitle.trim()) errors.title = 'Title is required';
    if (!manualPriority) errors.priority = 'Priority is required';
    if (manualDueDate) {
      if (new Date(manualDueDate) <= new Date()) {
        errors.dueDate = 'Due date must be in the future';
      }
    }
    setManualErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Recording ─────────────────────────────────────────────────────────────

  const startRecording = async () => {
    if (!transcriptionToggle) {
      useSampleClip();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
            // No API key or Whisper failed — use demo clip
            setTranscript(SAMPLE_TRANSCRIPT);
            applyStaticFields();
          } else {
            // Real Whisper transcript + Claude extraction
            setTranscript(data.text);
            applyParsedFields(data.parsed ?? NULL_PARSED);
          }
        } catch {
          setTranscript(SAMPLE_TRANSCRIPT);
          applyStaticFields();
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
    } catch {
      // Mic permission denied or MediaRecorder unavailable
      useSampleClip();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // ── Work order creation ───────────────────────────────────────────────────

  const createWorkOrder = () => {
    const allWorkOrders = getAllWorkOrders();
    const maxId = Math.max(
      0,
      ...allWorkOrders.map((wo) => {
        const match = wo.id.match(/WO-2026-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
    );
    const newId = `WO-2026-${String(maxId + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();

    if (createMode === 'voice') {
      if (!transcript) {
        alert('Please record a voice memo first.');
        return;
      }

      const newWorkOrder = {
        id: newId,
        title: voiceTitle.trim() || 'Untitled Work Order',
        description: transcript,
        propertyId: voicePropertyId,
        spaceId: voiceSpaceId,
        status: 'open' as const,
        priority: voicePriority,
        category: voiceCategory,
        assignedVendorId: voiceVendorId || undefined,
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      };

      addWorkOrder(newWorkOrder);
      addActivityFeedItem({
        id: `activity-${Date.now()}`,
        workOrderId: newId,
        message: `Created by ${currentUser.name}`,
        timestamp: now,
        userId: currentUser.id,
      });

      setTranscript('');
      setDisplayedTranscript('');
      setShowFields(false);
      resetVoiceFields();
      onClose();
    } else {
      if (!validateManualForm()) return;

      const newWorkOrder = {
        id: newId,
        title: manualTitle,
        description: manualDescription || '',
        propertyId: manualPropertyId || '',
        spaceId: manualSpaceId || '',
        assetId: manualAssetId || undefined,
        status: 'open' as const,
        priority: manualPriority,
        category: manualCategory,
        assignedVendorId: manualVendorId || undefined,
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
        assignedTechnicianId: manualTechnicianId || undefined,
        dueDate: manualDueDate || undefined,
      };

      addWorkOrder(newWorkOrder);
      addActivityFeedItem({
        id: `activity-${Date.now()}`,
        workOrderId: newId,
        message: `Created by ${currentUser.name}`,
        timestamp: now,
        userId: currentUser.id,
      });

      resetManualForm();
      onClose();
    }
  };

  // ── Derived display values ────────────────────────────────────────────────

  const voiceVendor = vendors.find((v) => v.id === voiceVendorId);
  const voicePropertySpaces = properties.find((p) => p.id === voicePropertyId)?.spaces ?? [];

  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                New Service Request
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {createMode === 'voice'
                  ? 'Record a voice memo — AI will extract the work order fields'
                  : 'Fill out the form to create a new service request'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Create via
            </label>
            <div className="inline-flex bg-neutral-900 border border-gray-700/40 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleModeChange('voice')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  createMode === 'voice'
                    ? 'bg-[#F5C518] text-neutral-950 shadow-sm'
                    : 'text-white hover:text-[#F5C518]'
                }`}
              >
                Voice + AI
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('manual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  createMode === 'manual'
                    ? 'bg-[#F5C518] text-neutral-950 shadow-sm'
                    : 'text-white hover:text-[#F5C518]'
                }`}
              >
                Manual Entry
              </button>
            </div>
          </div>

          {/* ── Voice Mode ─────────────────────────────────────────────────── */}
          {createMode === 'voice' ? (
            <>
              {/* Transcription Toggle */}
              <div className="flex items-center justify-between mb-6 p-4 bg-neutral-900 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-white">
                    Live Transcription
                  </span>
                  <span className="text-xs text-gray-500 ml-2">Whisper → Claude</span>
                </div>
                <button
                  onClick={() => setTranscriptionToggle(!transcriptionToggle)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    transcriptionToggle ? 'bg-[#F5C518]' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-neutral-950 rounded-full transition-transform ${
                      transcriptionToggle ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Recording Controls */}
              <div className="flex flex-col items-center gap-4 mb-8">
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
                    <MicOff className="w-8 h-8 text-neutral-950" />
                  ) : (
                    <Mic className="w-8 h-8 text-neutral-950" />
                  )}
                </button>
              </div>

              {/* Transcribing spinner */}
              {isTranscribing && (
                <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-neutral-900 rounded-lg">
                  <Loader2 className="w-5 h-5 text-[#F5C518] animate-spin" />
                  <span className="text-sm text-white">Transcribing & analyzing…</span>
                </div>
              )}

              {/* Transcript display */}
              {displayedTranscript && (
                <div className="mb-6 p-4 bg-neutral-900 rounded-lg">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Transcript
                  </p>
                  <p className="text-sm text-white">
                    {displayedTranscript}
                    {displayedTranscript.length < transcript.length && (
                      <span className="inline-block w-1 h-4 bg-[#F5C518] ml-1 animate-pulse" />
                    )}
                  </p>
                </div>
              )}

              {/* Editable extracted fields */}
              {showFields && (
                <div className="space-y-3 mb-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI-extracted fields — review and adjust as needed
                  </p>

                  {/* Title */}
                  <div className="p-3 bg-neutral-900 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Title</p>
                      <ConfidenceBadge extracted={aiExtracted.has('title')} />
                    </div>
                    <input
                      value={voiceTitle}
                      onChange={(e) => setVoiceTitle(e.target.value)}
                      placeholder="Work order title…"
                      className="w-full bg-neutral-800 border border-gray-700/40 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Priority */}
                    <div className="p-3 bg-neutral-900 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Priority</p>
                        <ConfidenceBadge extracted={aiExtracted.has('priority')} />
                      </div>
                      <select
                        value={voicePriority}
                        onChange={(e) => setVoicePriority(e.target.value as WorkOrderPriority)}
                        className="w-full bg-neutral-800 border border-gray-700/40 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div className="p-3 bg-neutral-900 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Category</p>
                        <ConfidenceBadge extracted={aiExtracted.has('category')} />
                      </div>
                      <select
                        value={voiceCategory}
                        onChange={(e) => setVoiceCategory(e.target.value as VendorCategory)}
                        className="w-full bg-neutral-800 border border-gray-700/40 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50"
                      >
                        <option value="MEP">MEP</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Janitorial">Janitorial</option>
                        <option value="Security">Security</option>
                        <option value="AV/Broadcast">AV/Broadcast</option>
                      </select>
                    </div>

                    {/* Property */}
                    <div className="p-3 bg-neutral-900 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Property</p>
                        <ConfidenceBadge extracted={aiExtracted.has('property')} />
                      </div>
                      <select
                        value={voicePropertyId}
                        onChange={(e) => {
                          setVoicePropertyId(e.target.value);
                          setVoiceSpaceId('');
                          setAiExtracted((prev) => {
                            const next = new Set(prev);
                            next.delete('space'); // space no longer confirmed
                            return next;
                          });
                        }}
                        className="w-full bg-neutral-800 border border-gray-700/40 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50"
                      >
                        <option value="">Select facility…</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Space */}
                    <div className="p-3 bg-neutral-900 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Space</p>
                        <ConfidenceBadge extracted={aiExtracted.has('space')} />
                      </div>
                      <select
                        value={voiceSpaceId}
                        onChange={(e) => setVoiceSpaceId(e.target.value)}
                        disabled={!voicePropertyId}
                        className="w-full bg-neutral-800 border border-gray-700/40 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">Select space…</option>
                        {voicePropertySpaces.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Suggested Vendor */}
                  <div className="p-3 bg-neutral-900 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Suggested Vendor</p>
                      <ConfidenceBadge extracted={aiExtracted.has('vendor')} />
                    </div>
                    <select
                      value={voiceVendorId}
                      onChange={(e) => setVoiceVendorId(e.target.value)}
                      className="w-full bg-neutral-800 border border-gray-700/40 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#F5C518]/50"
                    >
                      <option value="">None</option>
                      {allVendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.category})
                        </option>
                      ))}
                    </select>
                    {voiceVendor && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        {voiceVendor.slaCompliance.toFixed(1)}% SLA · {voiceVendor.avgResponseTime.toFixed(1)}h avg response
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Create button */}
              {showFields && (
                <div className="flex justify-end">
                  <Button onClick={createWorkOrder}>Create Service Request</Button>
                </div>
              )}
            </>
          ) : (
            /* ── Manual Entry Form ─────────────────────────────────────────── */
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Title <span className="text-[#E74C3C]">*</span>
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g., Leaking faucet in Unit 204"
                  className={`w-full bg-neutral-900 border ${
                    manualErrors.title ? 'border-[#E74C3C]' : 'border-gray-700/40'
                  } rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent`}
                />
                {manualErrors.title && (
                  <p className="mt-1 text-sm text-[#E74C3C]">{manualErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Additional details about the service request..."
                  rows={3}
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Priority <span className="text-[#E74C3C]">*</span>
                </label>
                <select
                  value={manualPriority}
                  onChange={(e) => setManualPriority(e.target.value as WorkOrderPriority)}
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Property → Space → Asset */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Property</label>
                  <select
                    value={manualPropertyId}
                    onChange={(e) => {
                      setManualPropertyId(e.target.value);
                      setManualSpaceId('');
                      setManualAssetId('');
                    }}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Space</label>
                  <select
                    value={manualSpaceId}
                    onChange={(e) => {
                      setManualSpaceId(e.target.value);
                      setManualAssetId('');
                    }}
                    disabled={!manualPropertyId}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Space</option>
                    {manualPropertyId &&
                      properties
                        .find((p) => p.id === manualPropertyId)
                        ?.spaces.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Asset</label>
                  <select
                    value={manualAssetId}
                    onChange={(e) => setManualAssetId(e.target.value)}
                    disabled={!manualSpaceId}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Asset (Optional)</option>
                    {manualSpaceId &&
                      allAssets
                        .filter((a) => a.spaceId === manualSpaceId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as VendorCategory)}
                  className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                >
                  <option value="MEP">MEP</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Janitorial">Janitorial</option>
                  <option value="Security">Security</option>
                  <option value="AV/Broadcast">AV/Broadcast</option>
                </select>
              </div>

              {/* Vendor + Technician */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Vendor</label>
                  <select
                    value={manualVendorId}
                    onChange={(e) => {
                      setManualVendorId(e.target.value);
                      setManualTechnicianId('');
                    }}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                  >
                    <option value="">Select Vendor (Optional)</option>
                    {allVendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Technician</label>
                  <select
                    value={manualTechnicianId}
                    onChange={(e) => setManualTechnicianId(e.target.value)}
                    disabled={!manualVendorId}
                    className="w-full bg-neutral-900 border border-gray-700/40 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Technician (Optional)</option>
                    {manualVendorId &&
                      getTechniciansByVendor(manualVendorId).map((tech) => (
                        <option key={tech.id} value={tech.id}>{tech.fullName}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Due Date</label>
                <input
                  type="date"
                  value={manualDueDate}
                  onChange={(e) => setManualDueDate(e.target.value)}
                  className={`w-full bg-neutral-900 border ${
                    manualErrors.dueDate ? 'border-[#E74C3C]' : 'border-gray-700/40'
                  } rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent`}
                />
                {manualErrors.dueDate && (
                  <p className="mt-1 text-sm text-[#E74C3C]">{manualErrors.dueDate}</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white hover:text-[#F5C518] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createWorkOrder}
                  disabled={!manualTitle.trim()}
                  className="px-4 py-2 bg-[#F5C518] text-neutral-950 rounded-lg font-medium hover:bg-[#F5C518]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Service Request
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
