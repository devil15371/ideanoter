import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Check,
  RefreshCw,
  Copy,
  Download,
  Upload,
  Database,
  AlertCircle,
  Smartphone,
  Laptop,
} from 'lucide-react';
import type { SupabaseConfig, Idea } from '../types/idea';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
} from '../services/supabase';
import { exportIdeasToJSON, exportIdeasToMarkdown } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: Idea[];
  onImportIdeas: (imported: Idea[]) => void;
  onResetSeedData: () => void;
  onTriggerSync: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  ideas,
  onImportIdeas,
  onResetSeedData,
  onTriggerSync,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [tableName, setTableName] = useState('ideas');
  const [testStatus, setTestStatus] = useState<{ testing: boolean; success?: boolean; message?: string }>({
    testing: false,
  });
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const cfg = getSavedSupabaseConfig();
    setSupabaseUrl(cfg.url || '');
    setSupabaseAnonKey(cfg.anonKey || '');
    setTableName(cfg.tableName || 'ideas');
  }, [isOpen]);

  const handleSaveAndTest = async () => {
    setTestStatus({ testing: true });
    const config: SupabaseConfig = {
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
      tableName: tableName.trim() || 'ideas',
      isConnected: false,
    };

    saveSupabaseConfig(config);

    if (!config.url || !config.anonKey) {
      setTestStatus({
        testing: false,
        success: false,
        message: 'Please provide both Supabase URL and Anon Key to enable live cloud sync.',
      });
      return;
    }

    const res = await testSupabaseConnection(config.url, config.anonKey, config.tableName);
    if (res.success) {
      config.isConnected = true;
      saveSupabaseConfig(config);
      setTestStatus({ testing: false, success: true, message: res.message });
      onTriggerSync();
    } else {
      setTestStatus({ testing: false, success: false, message: res.message });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportIdeas(parsed);
          alert(`Successfully imported ${parsed.length} ideas into your vault!`);
        } else {
          alert('Invalid backup format. Expected a JSON list of ideas.');
        }
      } catch (err) {
        alert('Failed to parse backup file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  // Detect running environment
  const isStandalone =
    typeof window !== 'undefined' &&
    ((window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches);

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isMac = /Macintosh|Mac OS X/i.test(userAgent) && !isIOS;
  const isWindows = /Windows/i.test(userAgent);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container settings-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="spark-emoji">⚙️</span>
            <div>
              <h2 className="modal-title">Settings & Cloud Synchronization</h2>
              <p className="modal-subtitle">
                Sync ideas in real-time between your iPhone, Mac & Windows PC, manage backups and export notes.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="settings-body">
          {/* Current Device Environment Info */}
          <div className="device-status-strip">
            <div className="device-icon-wrap">
              {isIOS ? <Smartphone size={18} /> : isMac ? <Laptop size={18} /> : <Laptop size={18} />}
            </div>
            <div className="device-meta">
              <strong>Device Detected: {isIOS ? 'iPhone / iOS' : isMac ? 'Mac (macOS)' : isWindows ? 'Windows PC' : 'Web Client'}</strong>
              <span>
                {isStandalone
                  ? '✨ Running in Native Standalone App Mode (Full Screen)'
                  : 'Running in Browser. (Tip: Use "Get on iPhone" or browser Install to run standalone)'}
              </span>
            </div>
          </div>

          {/* Cloud Sync (Supabase) Section */}
          <div className="settings-section">
            <div className="section-title-row">
              <Cloud size={18} className="text-blue" />
              <div>
                <h3 className="section-title">Supabase Real-time Cloud Sync (Free)</h3>
                <p className="section-desc">
                  Connect your free Supabase project to seamlessly sync ideas live between your phone and computer.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Project URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Anon Public Key</label>
              <input
                type="password"
                className="form-input font-mono"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Database Table Name</label>
              <input
                type="text"
                className="form-input font-mono"
                placeholder="ideas"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
              />
            </div>

            {testStatus.message && (
              <div className={`status-alert ${testStatus.success ? 'success' : 'error'}`}>
                {testStatus.success ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{testStatus.message}</span>
              </div>
            )}

            <div className="sync-buttons-row">
              <button
                className="btn-primary"
                onClick={handleSaveAndTest}
                disabled={testStatus.testing}
              >
                {testStatus.testing ? <RefreshCw size={14} className="spin" /> : <Database size={14} />}
                <span>{testStatus.testing ? 'Testing Connection...' : 'Save & Test Cloud Sync'}</span>
              </button>

              <button className="btn-secondary" onClick={handleCopySql}>
                {copiedSql ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy Supabase Table SQL'}</span>
              </button>
            </div>
          </div>

          {/* Backup & Vault Management */}
          <div className="settings-section">
            <div className="section-title-row">
              <Database size={18} className="text-emerald" />
              <div>
                <h3 className="section-title">Vault Backup & Export</h3>
                <p className="section-desc">
                  Keep your intellectual property 100% private, export to Obsidian / Notion or backup locally.
                </p>
              </div>
            </div>

            <div className="backup-buttons-grid">
              <button className="backup-action-card" onClick={() => exportIdeasToJSON(ideas)}>
                <Download size={20} className="text-blue" />
                <div>
                  <strong>Download JSON Backup</strong>
                  <span>Full machine-readable backup file</span>
                </div>
              </button>

              <button className="backup-action-card" onClick={() => exportIdeasToMarkdown(ideas)}>
                <Download size={20} className="text-purple" />
                <div>
                  <strong>Export Markdown (.md)</strong>
                  <span>Formatted for Notion, Obsidian & Apple Notes</span>
                </div>
              </button>

              <label className="backup-action-card file-upload-card">
                <Upload size={20} className="text-emerald" />
                <div>
                  <strong>Restore from JSON</strong>
                  <span>Import saved ideas backup</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  className="hidden-file-input"
                  onChange={handleFileUpload}
                />
              </label>

              <button
                className="backup-action-card danger"
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to reset your vault to the initial demo ideas? (Any custom ideas will be replaced)'
                    )
                  ) {
                    onResetSeedData();
                  }
                }}
              >
                <RefreshCw size={20} className="text-rose" />
                <div>
                  <strong>Reset to Seed Demo</strong>
                  <span>Restore default sample startup ideas</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
