// Theme Editor for Organization Chart
class ThemeEditor {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadCurrentTheme();
  }

  setupEventListeners() {
    // Edit Theme button
    const editThemeBtn = document.getElementById('editThemeBtn');
    if (editThemeBtn) {
      editThemeBtn.addEventListener('click', () => this.showEditThemeModal());
    }

    // Modal close buttons
    const closeThemeBtn = document.getElementById('closeThemeBtn');
    const cancelThemeBtn = document.getElementById('cancelThemeBtn');
    
    if (closeThemeBtn) {
      closeThemeBtn.addEventListener('click', () => this.hideEditThemeModal());
    }
    
    if (cancelThemeBtn) {
      cancelThemeBtn.addEventListener('click', () => this.hideEditThemeModal());
    }

    // Form submission
    const editThemeForm = document.getElementById('editThemeForm');
    if (editThemeForm) {
      editThemeForm.addEventListener('submit', (e) => this.handleThemeSubmit(e));
    }

    // Color input synchronization
    this.setupColorInputSync();
    
    // Logo upload
    const themeUploadLogoBtn = document.getElementById('themeUploadLogoBtn');
    const themeOrgLogoInput = document.getElementById('themeOrgLogo');
    
    if (themeUploadLogoBtn && themeOrgLogoInput) {
      themeUploadLogoBtn.addEventListener('click', () => themeOrgLogoInput.click());
    }
    
    if (themeOrgLogoInput) {
      themeOrgLogoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
    }
  }

  setupColorInputSync() {
    const primaryColorInput = document.getElementById('themePrimaryColor');
    const primaryColorText = document.getElementById('themePrimaryColorText');
    const secondaryColorInput = document.getElementById('themeSecondaryColor');
    const secondaryColorText = document.getElementById('themeSecondaryColorText');

    if (primaryColorInput && primaryColorText) {
      primaryColorInput.addEventListener('input', (e) => {
        primaryColorText.value = e.target.value;
      });
      
      primaryColorText.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          primaryColorInput.value = e.target.value;
        }
      });
    }

    if (secondaryColorInput && secondaryColorText) {
      secondaryColorInput.addEventListener('input', (e) => {
        secondaryColorText.value = e.target.value;
      });
      
      secondaryColorText.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          secondaryColorInput.value = e.target.value;
        }
      });
    }
  }

  showEditThemeModal() {
    const panel = document.getElementById('editThemePanel');
    if (panel) {
      panel.classList.remove('hidden');
      this.loadCurrentTheme();
    }
  }

  hideEditThemeModal() {
    const panel = document.getElementById('editThemePanel');
    if (panel) {
      panel.classList.add('hidden');
    }
  }

  loadCurrentTheme() {
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (!currentOrgId) return;

    // Load organization data
    const orgData = JSON.parse(localStorage.getItem(`org_${currentOrgId}`) || '{}');
    const brandingData = JSON.parse(localStorage.getItem(`org_branding_${currentOrgId}`) || '{}');

    // Update form fields
    const orgNameInput = document.getElementById('themeOrgName');
    const orgDescriptionInput = document.getElementById('themeOrgDescription');
    
    if (orgNameInput) {
      orgNameInput.value = orgData.name || '';
    }
    
    if (orgDescriptionInput) {
      orgDescriptionInput.value = orgData.description || '';
    }

    // Update color inputs
    const primaryColorInput = document.getElementById('themePrimaryColor');
    const primaryColorText = document.getElementById('themePrimaryColorText');
    const secondaryColorInput = document.getElementById('themeSecondaryColor');
    const secondaryColorText = document.getElementById('themeSecondaryColorText');

    const primaryColor = brandingData.primaryColor || '#ff5a00';
    const secondaryColor = brandingData.secondaryColor || '#e53e3e';

    if (primaryColorInput) primaryColorInput.value = primaryColor;
    if (primaryColorText) primaryColorText.value = primaryColor;
    if (secondaryColorInput) secondaryColorInput.value = secondaryColor;
    if (secondaryColorText) secondaryColorText.value = secondaryColor;

    // Update font family and size
    const fontFamilySelect = document.getElementById('themeFontFamily');
    const fontSizeSelect = document.getElementById('themeFontSize');

    if (fontFamilySelect) {
      fontFamilySelect.value = brandingData.fontFamily || 'system';
    }
    
    if (fontSizeSelect) {
      fontSizeSelect.value = brandingData.fontSize || '16';
    }

    // Update logo preview
    if (brandingData.logo) {
      const logoPreview = document.getElementById('themeLogoPreview');
      if (logoPreview) {
        logoPreview.innerHTML = `<img src="${brandingData.logo}" alt="Organization Logo" style="max-width: 100px; max-height: 60px;">`;
      }
    }
  }

  handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoPreview = document.getElementById('themeLogoPreview');
        if (logoPreview) {
          logoPreview.innerHTML = `<img src="${e.target.result}" alt="Organization Logo" style="max-width: 100px; max-height: 60px;">`;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  handleThemeSubmit(e) {
    e.preventDefault();
    
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (!currentOrgId) {
      console.error('No current organization found');
      return;
    }

    const formData = new FormData(e.target);
    
    // Update organization data
    const orgData = JSON.parse(localStorage.getItem(`org_${currentOrgId}`) || '{}');
    orgData.name = formData.get('orgName') || orgData.name;
    orgData.description = formData.get('orgDescription') || orgData.description;
    localStorage.setItem(`org_${currentOrgId}`, JSON.stringify(orgData));

    // Update branding data
    const brandingData = {
      primaryColor: formData.get('primaryColor'),
      secondaryColor: formData.get('secondaryColor'),
      fontFamily: formData.get('fontFamily'),
      fontSize: formData.get('fontSize'),
      logo: null
    };

    // Handle logo upload
    const logoFile = formData.get('orgLogo');
    if (logoFile && logoFile.size > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        brandingData.logo = e.target.result;
        this.saveThemeAndApply(brandingData, orgData);
      };
      reader.readAsDataURL(logoFile);
    } else {
      // Keep existing logo if no new one uploaded
      const existingBranding = JSON.parse(localStorage.getItem(`org_branding_${currentOrgId}`) || '{}');
      brandingData.logo = existingBranding.logo;
      this.saveThemeAndApply(brandingData, orgData);
    }
  }

  saveThemeAndApply(brandingData, orgData) {
    const currentOrgId = localStorage.getItem('current_organization_id');
    
    // Save branding data
    localStorage.setItem(`org_branding_${currentOrgId}`, JSON.stringify(brandingData));
    
    // Apply theme immediately
    this.applyTheme(brandingData, orgData);
    
    // Hide modal
    this.hideEditThemeModal();
    
    // Show success message
    this.showSuccessMessage('Theme updated successfully!');
  }

  applyTheme(brandingData, orgData) {
    // Update header with organization info
    const orgNameElement = document.getElementById('orgName');
    const orgDescriptionElement = document.getElementById('orgDescription');
    
    if (orgNameElement) {
      orgNameElement.textContent = orgData.name || 'Organization Chart';
    }
    
    if (orgDescriptionElement) {
      orgDescriptionElement.textContent = orgData.description || 'Visualize and manage your organization structure';
    }

    // Also update the organization list in localStorage
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (currentOrgId && orgData.name) {
      const orgList = JSON.parse(localStorage.getItem('organizations_list') || '[]');
      const orgIndex = orgList.findIndex(org => org.id === currentOrgId);
      if (orgIndex !== -1) {
        orgList[orgIndex].name = orgData.name;
        localStorage.setItem('organizations_list', JSON.stringify(orgList));
      }
    }

    // Apply CSS custom properties
    document.documentElement.style.setProperty('--primary-color', brandingData.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', brandingData.secondaryColor);
    document.documentElement.style.setProperty('--brand-gradient', 
      `linear-gradient(135deg, ${brandingData.primaryColor} 0%, ${brandingData.secondaryColor} 100%)`);

    // Apply font family
    const fontFamily = this.getFontFamily(brandingData.fontFamily);
    document.documentElement.style.setProperty('--font-family', fontFamily);
    document.body.style.fontFamily = fontFamily;

    // Apply font size
    document.documentElement.style.setProperty('--base-font-size', `${brandingData.fontSize}px`);
    document.body.style.fontSize = `${brandingData.fontSize}px`;

    // Apply logo
    if (brandingData.logo) {
      const headers = document.querySelectorAll('header');
      headers.forEach(header => {
        const existingLogo = header.querySelector('.organization-logo');
        if (existingLogo) {
          existingLogo.src = brandingData.logo;
        } else {
          const logo = document.createElement('img');
          logo.src = brandingData.logo;
          logo.alt = 'Organization Logo';
          logo.className = 'organization-logo';
          logo.style.cssText = 'height: 45px; margin-right: 1rem; filter: brightness(0) invert(1);';
          header.insertBefore(logo, header.firstChild);
        }
      });
    }
  }

  getFontFamily(fontFamily) {
    const fontMap = {
      'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'inter': '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      'roboto': '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
      'open-sans': '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      'lato': '"Lato", -apple-system, BlinkMacSystemFont, sans-serif',
      'montserrat': '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
      'poppins': '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif'
    };
    return fontMap[fontFamily] || fontMap['system'];
  }

  showSuccessMessage(message) {
    // Create or update success message
    let messageDiv = document.getElementById('themeMessage');
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.id = 'themeMessage';
      messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-weight: 500;
      `;
      document.body.appendChild(messageDiv);
    }
    
    messageDiv.textContent = message;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (messageDiv && messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  }
}

// Initialize theme editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ThemeEditor();
});
