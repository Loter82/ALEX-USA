/**
 * Simple Lead Capture Modal
 * Just name + phone — no addresses, no valuation.
 * Include this script on any page and call openLeadModal() to show.
 */

(function() {
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwtE1bn0GFZBEWbOzqs1EyqLheS8olbFUzCogc4EdiL6BIgbPVSSkJfGrJDA3TOF4Ui/exec';

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        .lead-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            z-index: 100000;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .lead-overlay.active {
            display: flex;
        }
        .lead-modal {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 45px 40px 40px;
            max-width: 460px;
            width: 100%;
            position: relative;
            box-shadow: 0 25px 60px rgba(0,0,0,0.15);
            animation: leadModalIn 0.35s ease-out;
        }
        @keyframes leadModalIn {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .lead-modal-close {
            position: absolute;
            top: 14px;
            right: 18px;
            background: none;
            border: none;
            color: #94a3b8;
            font-size: 1.6em;
            cursor: pointer;
            line-height: 1;
            transition: color 0.2s;
        }
        .lead-modal-close:hover { color: #1e293b; }
        .lead-modal h2 {
            text-align: center;
            color: #1e40af;
            font-size: 1.7em;
            margin-bottom: 8px;
        }
        .lead-modal .lead-subtitle {
            text-align: center;
            color: #64748b;
            font-size: 1em;
            margin-bottom: 28px;
            line-height: 1.5;
        }
        .lead-modal label {
            display: block;
            color: #475569;
            font-weight: 600;
            margin-bottom: 6px;
            font-size: 0.95em;
        }
        .lead-modal input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            background: #f8fafc;
            color: #1e293b;
            font-size: 1.05em;
            margin-bottom: 18px;
            outline: none;
            transition: border-color 0.25s;
            box-sizing: border-box;
        }
        .lead-modal input::placeholder { color: #94a3b8; }
        .lead-modal input:focus { border-color: #2563eb; }
        .lead-modal .lead-submit-btn {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff;
            font-size: 1.15em;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: all 0.25s;
            box-shadow: 0 6px 25px rgba(37,99,235,0.3);
        }
        .lead-modal .lead-submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 35px rgba(37,99,235,0.4);
        }
        .lead-modal .lead-submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        .lead-modal .lead-privacy {
            text-align: center;
            color: #94a3b8;
            font-size: 0.82em;
            margin-top: 14px;
            line-height: 1.5;
        }
        .lead-modal .lead-success {
            text-align: center;
            padding: 20px 0;
        }
        .lead-modal .lead-success .check-icon {
            font-size: 3.5em;
            margin-bottom: 14px;
        }
        .lead-modal .lead-success h3 {
            color: #059669;
            font-size: 1.5em;
            margin-bottom: 10px;
        }
        .lead-modal .lead-success p {
            color: #475569;
            font-size: 1.05em;
            line-height: 1.5;
        }
        @media (max-width: 500px) {
            .lead-modal {
                padding: 35px 22px 30px;
            }
            .lead-modal h2 { font-size: 1.35em; }
        }
    `;
    document.head.appendChild(style);

    // Inject HTML
    const overlay = document.createElement('div');
    overlay.className = 'lead-overlay';
    overlay.id = 'leadOverlay';
    overlay.innerHTML = `
        <div class="lead-modal" id="leadModal">
            <button class="lead-modal-close" onclick="closeLeadModal()" aria-label="Close">&times;</button>
            <div id="leadFormContent">
                <h2>Get Your Free Cash Offer</h2>
                <p class="lead-subtitle">Enter your name and phone number — we'll reach out with a no-obligation offer.</p>
                <form id="simpleLeadForm" autocomplete="on">
                    <label for="leadNameInput">Your Name</label>
                    <input type="text" id="leadNameInput" name="name" placeholder="John Smith" required autocomplete="name">
                    <label for="leadPhoneInput">Phone Number</label>
                    <input type="tel" id="leadPhoneInput" name="phone" placeholder="(330) 000-0000" required autocomplete="tel">
                    <button type="submit" class="lead-submit-btn">Get My Free Cash Offer →</button>
                </form>
                <p class="lead-privacy">🔒 Your info is private. No spam, no obligation.</p>
            </div>
            <div id="leadSuccessContent" style="display:none;">
                <div class="lead-success">
                    <div class="check-icon">✅</div>
                    <h3>Thank You!</h3>
                    <p>We received your info and will contact you <strong>within 24 hours</strong> with your cash offer!</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeLeadModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeLeadModal();
    });

    // Phone formatting
    const phoneInput = document.getElementById('leadPhoneInput');
    phoneInput.addEventListener('input', function() {
        let digits = this.value.replace(/\D/g, '');
        if (digits.length > 10) digits = digits.substring(0, 10);
        if (digits.length >= 7) {
            this.value = '(' + digits.substring(0,3) + ') ' + digits.substring(3,6) + '-' + digits.substring(6);
        } else if (digits.length >= 4) {
            this.value = '(' + digits.substring(0,3) + ') ' + digits.substring(3);
        } else if (digits.length > 0) {
            this.value = '(' + digits;
        }
    });

    // Form submission
    document.getElementById('simpleLeadForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = this.querySelector('.lead-submit-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;

        const leadData = {
            type: 'quick-lead',
            name: document.getElementById('leadNameInput').value.trim(),
            phone: document.getElementById('leadPhoneInput').value.trim(),
            email: '',
            propertyAddress: '',
            propertyDetails: {},
            source: document.title,
            pageUrl: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        console.log('🎯 QUICK LEAD:', leadData);

        try {
            fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
            console.log('✅ Lead sent');

            // Google Ads conversion tracking
            if (typeof gtag_report_conversion === 'function') {
                gtag_report_conversion();
            }
            // GA4 event
            if (typeof gtag === 'function') {
                gtag('event', 'lead_submit', {
                    'event_category': 'lead',
                    'event_label': 'quick_form',
                    'page': window.location.pathname
                });
            }

            document.getElementById('leadFormContent').style.display = 'none';
            document.getElementById('leadSuccessContent').style.display = 'block';

            // Auto-close after 4 seconds
            setTimeout(closeLeadModal, 4000);
        } catch (err) {
            console.error('❌ Lead error:', err);
            btn.textContent = originalText;
            btn.disabled = false;
            alert('Something went wrong. Please try again or call us at (330) 413-4047.');
        }
    });

    // Expose global functions
    window.openLeadModal = function() {
        // Reset form state
        document.getElementById('leadFormContent').style.display = 'block';
        document.getElementById('leadSuccessContent').style.display = 'none';
        document.getElementById('simpleLeadForm').reset();
        const btn = document.querySelector('.lead-submit-btn');
        if (btn) { btn.textContent = 'Get My Free Cash Offer →'; btn.disabled = false; }
        // Show
        document.getElementById('leadOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        // Focus first field
        setTimeout(function() { document.getElementById('leadNameInput').focus(); }, 100);
    };

    window.closeLeadModal = function() {
        document.getElementById('leadOverlay').classList.remove('active');
        document.body.style.overflow = '';
    };
})();
