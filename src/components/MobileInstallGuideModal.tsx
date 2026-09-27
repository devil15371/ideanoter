import React, { useEffect, useState } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Monitor,
  Share2,
  PlusSquare,
  Check,
  Copy,
} from 'lucide-react';
import QRCode from 'qrcode';

interface MobileInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInstallGuideModal: React.FC<MobileInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'iphone' | 'mac' | 'windows' | 'android'>('iphone');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setAppUrl(url);
      QRCode.toDataURL(url, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch((err) => console.error('QR code generation error', err));
    }
  }, [isOpen]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container install-guide-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="spark-emoji">📲</span>
            <div>
              <h2 className="modal-title">Install IdeaNoter on Your Devices</h2>
              <p className="modal-subtitle">
                Run IdeaNoter as a real standalone app with zero browser clutter on iPhone, Mac, Windows & Android.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Device Selection Tabs */}
        <div className="install-device-tabs">
          <button
            className={`install-tab ${activeTab === 'iphone' ? 'active' : ''}`}
            onClick={() => setActiveTab('iphone')}
          >
            <Smartphone size={16} />
            <span>iPhone / iOS</span>
          </button>
          <button
            className={`install-tab ${activeTab === 'mac' ? 'active' : ''}`}
            onClick={() => setActiveTab('mac')}
          >
            <Laptop size={16} />
            <span>Mac (Desktop)</span>
          </button>
          <button
            className={`install-tab ${activeTab === 'windows' ? 'active' : ''}`}
            onClick={() => setActiveTab('windows')}
          >
            <Monitor size={16} />
            <span>Windows (PC)</span>
          </button>
          <button
            className={`install-tab ${activeTab === 'android' ? 'active' : ''}`}
            onClick={() => setActiveTab('android')}
          >
            <Smartphone size={16} />
            <span>Android</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="install-guide-content">
          {/* Quick QR Code Bar */}
          <div className="qr-sync-strip">
            <div className="qr-box">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Scan QR Code to open on mobile" className="qr-image" />
              ) : (
                <div className="qr-placeholder">Generating QR...</div>
              )}
            </div>
            <div className="qr-info">
              <h4>Instant Mobile Launch:</h4>
              <p>Point your iPhone or Android camera at this QR code to open IdeaNoter immediately on your phone.</p>
              <div className="copy-url-row">
                <input type="text" readOnly value={appUrl} className="url-input" />
                <button className="btn-secondary copy-btn" onClick={handleCopyUrl}>
                  {isCopied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* iPhone Tab */}
          {activeTab === 'iphone' && (
            <div className="platform-guide">
              <h3 className="guide-heading">How to install as a Native Standalone App on iPhone:</h3>
              <div className="guide-steps">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <div className="step-body">
                    <strong>Open the link in Safari</strong>
                    <p>Scan the QR code above with your iPhone camera or open the link in Safari.</p>
                  </div>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <div className="step-body">
                    <strong>Tap the Share Button</strong>
                    <p>
                      At the bottom of Safari, tap the <strong>Share</strong> icon (the square with the arrow pointing up <Share2 size={13} style={{ display: 'inline' }} />).
                    </p>
                  </div>
                </div>
                <div className="step-card highlight">
                  <div className="step-number">3</div>
                  <div className="step-body">
                    <strong>Select "Add to Home Screen"</strong>
                    <p>
                      Scroll down slightly and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={13} style={{ display: 'inline' }} />.
                    </p>
                  </div>
                </div>
                <div className="step-card">
                  <div className="step-number">4</div>
                  <div className="step-body">
                    <strong>Tap "Add" in top-right</strong>
                    <p>
                      IdeaNoter will now appear on your iPhone home screen! It opens <strong>fullscreen without any browser bars</strong>, supports offline note taking, and syncs instantly with your Mac & PC.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mac Tab */}
          {activeTab === 'mac' && (
            <div className="platform-guide">
              <h3 className="guide-heading">How to install as a Desktop App on Mac:</h3>
              <div className="guide-steps">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <div className="step-body">
                    <strong>In Chrome / Brave / Edge:</strong>
                    <p>
                      Look at the right side of your browser address bar. Click the <strong>Install App</strong> icon (monitor with a down arrow), or click the 3-dot menu → <strong>"Save and share" → "Install IdeaNoter"</strong>.
                    </p>
                  </div>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <div className="step-body">
                    <strong>In Safari (macOS Sonoma or later):</strong>
                    <p>
                      Click <strong>File</strong> in the top menu bar → <strong>"Add to Dock..."</strong>.
                    </p>
                  </div>
                </div>
                <div className="step-card highlight">
                  <div className="step-number">3</div>
                  <div className="step-body">
                    <strong>Enjoy Desktop Independence</strong>
                    <p>
                      IdeaNoter will sit right in your Mac Dock, run in its own dedicated window, support keyboard shortcut <code>⌘N</code> for rapid capture, and launch instantly without opening a browser!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Windows Tab */}
          {activeTab === 'windows' && (
            <div className="platform-guide">
              <h3 className="guide-heading">How to install as a Desktop App on Windows 10/11:</h3>
              <div className="guide-steps">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <div className="step-body">
                    <strong>In Microsoft Edge or Google Chrome:</strong>
                    <p>
                      Click the <strong>"App available. Install IdeaNoter"</strong> button in the URL bar, or click the 3 dots menu → <strong>Apps → Install IdeaNoter</strong>.
                    </p>
                  </div>
                </div>
                <div className="step-card highlight">
                  <div className="step-number">2</div>
                  <div className="step-body">
                    <strong>Pin to Windows Taskbar</strong>
                    <p>
                      When prompted, check <strong>"Pin to taskbar"</strong> and <strong>"Pin to Start"</strong>. IdeaNoter now runs like any native Windows program (.exe), completely borderless!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Tab */}
          {activeTab === 'android' && (
            <div className="platform-guide">
              <h3 className="guide-heading">How to install on Android:</h3>
              <div className="guide-steps">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <div className="step-body">
                    <strong>Open in Chrome on Android:</strong>
                    <p>Scan the QR code or navigate to the link.</p>
                  </div>
                </div>
                <div className="step-card highlight">
                  <div className="step-number">2</div>
                  <div className="step-body">
                    <strong>Tap "Install App" or "Add to Home screen":</strong>
                    <p>
                      Tap the banner at the bottom or the top 3-dot menu → <strong>"Install app"</strong>. It installs directly onto your phone app drawer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
