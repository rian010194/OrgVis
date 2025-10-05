// Supabase-powered Theme Editor for Organization Chart
// Note: orgDb is made globally available by supabase-multi-org.js

class SupabaseThemeEditor {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadCurrentTheme();
    this.initializeHeader();
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

  async initializeHeader() {
    // Initialize header with current organization data from Supabase
    const currentOrgId = localStorage.getItem('current_organization_id');
    console.log('SupabaseThemeEditor: Initializing header with org ID:', currentOrgId);
    
    if (currentOrgId) {
      try {
        const orgData = await window.orgDb.getOrganization(currentOrgId);
        console.log('SupabaseThemeEditor: Org data from Supabase:', orgData);
        
        // Update header
        const orgNameElement = document.getElementById('orgName');
        const orgDescriptionElement = document.getElementById('orgDescription');
        
        console.log('SupabaseThemeEditor: Header elements found:', {
          orgName: !!orgNameElement,
          orgDescription: !!orgDescriptionElement
        });
        
        if (orgNameElement && orgData.name) {
          console.log('SupabaseThemeEditor: Updating org name from', orgNameElement.textContent, 'to', orgData.name);
          orgNameElement.textContent = orgData.name;
        }
        
        if (orgDescriptionElement && orgData.description) {
          console.log('SupabaseThemeEditor: Updating org description from', orgDescriptionElement.textContent, 'to', orgData.description);
          orgDescriptionElement.textContent = orgData.description;
        }

        // Apply branding if available
        if (orgData.branding && (orgData.branding.primaryColor || orgData.branding.secondaryColor)) {
          this.applyTheme(orgData.branding, orgData);
        }
      } catch (error) {
        console.error('SupabaseThemeEditor: Error loading organization data:', error);
      }
    } else {
      // If no current org ID, try to set it to demo
      const demoOrgId = 'demo_org';
      try {
        const demoData = await window.orgDb.getOrganization(demoOrgId);
        if (demoData && demoData.name) {
          localStorage.setItem('current_organization_id', demoOrgId);
          this.initializeHeader();
        }
      } catch (error) {
        console.error('SupabaseThemeEditor: Error loading demo organization:', error);
      }
    }
  }

  // Public method to refresh header from external calls
  async refreshHeader() {
    console.log('SupabaseThemeEditor: Refreshing header...');
    await this.initializeHeader();
  }

  // Update header in real-time as user types
  updateHeaderInRealTime() {
    const orgNameInput = document.getElementById('themeOrgName');
    const orgDescriptionInput = document.getElementById('themeOrgDescription');
    const orgNameElement = document.getElementById('orgName');
    const orgDescriptionElement = document.getElementById('orgDescription');
    
    if (orgNameInput && orgNameElement) {
      const newName = orgNameInput.value || 'Organization Chart';
      console.log('SupabaseThemeEditor: Real-time update - changing org name to:', newName);
      orgNameElement.textContent = newName;
    }
    
    if (orgDescriptionInput && orgDescriptionElement) {
      const newDescription = orgDescriptionInput.value || 'Visualize and manage your organization structure';
      console.log('SupabaseThemeEditor: Real-time update - changing org description to:', newDescription);
      orgDescriptionElement.textContent = newDescription;
    }
  }

  setupColorInputSync() {
    // Define all color input pairs
    const colorInputs = [
      { color: 'themePrimaryColor', text: 'themePrimaryColorText' },
      { color: 'themeSecondaryColor', text: 'themeSecondaryColorText' },
      { color: 'themeBackgroundColor', text: 'themeBackgroundColorText' },
      { color: 'themeTextColor', text: 'themeTextColorText' },
      { color: 'themeBorderColor', text: 'themeBorderColorText' },
      { color: 'themeMutedColor', text: 'themeMutedColorText' }
    ];

    colorInputs.forEach(({ color, text }) => {
      const colorInput = document.getElementById(color);
      const textInput = document.getElementById(text);

      if (colorInput && textInput) {
        colorInput.addEventListener('input', (e) => {
          textInput.value = e.target.value;
          this.updateColorPreview(color, e.target.value);
          this.previewThemeChanges();
        });
        
        textInput.addEventListener('input', (e) => {
          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
            colorInput.value = e.target.value;
            this.updateColorPreview(color, e.target.value);
            this.previewThemeChanges();
          }
        });
      }
    });

    // Setup real-time title/description updates
    const orgNameInput = document.getElementById('themeOrgName');
    const orgDescriptionInput = document.getElementById('themeOrgDescription');

    if (orgNameInput) {
      orgNameInput.addEventListener('input', () => {
        this.previewThemeChanges();
        // Also update the header immediately
        this.updateHeaderInRealTime();
      });
    }

    if (orgDescriptionInput) {
      orgDescriptionInput.addEventListener('input', () => {
        this.previewThemeChanges();
        // Also update the header immediately
        this.updateHeaderInRealTime();
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

  async loadCurrentTheme() {
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (!currentOrgId) {
      // If no current org ID, try to get from organizations list
      try {
        const orgList = await window.orgDb.getOrganizations();
        if (orgList && orgList.length > 0) {
          const firstOrg = orgList[0];
          localStorage.setItem('current_organization_id', firstOrg.id);
          this.loadCurrentTheme();
          return;
        }
      } catch (error) {
        console.error('SupabaseThemeEditor: Error loading organizations list:', error);
      }
      return;
    }

    try {
      // Load organization data from Supabase
      const orgData = await window.orgDb.getOrganization(currentOrgId);
      const brandingData = orgData.branding || {};

      // Update form fields
      const orgNameInput = document.getElementById('themeOrgName');
      const orgDescriptionInput = document.getElementById('themeOrgDescription');
      
      if (orgNameInput) {
        orgNameInput.value = orgData.name || 'My Organization';
      }
      
      if (orgDescriptionInput) {
        orgDescriptionInput.value = orgData.description || 'Organization description';
      }

      // Update all color inputs
      const colorMappings = [
        { key: 'primaryColor', input: 'themePrimaryColor', text: 'themePrimaryColorText', default: '#ff5a00' },
        { key: 'secondaryColor', input: 'themeSecondaryColor', text: 'themeSecondaryColorText', default: '#e53e3e' },
        { key: 'backgroundColor', input: 'themeBackgroundColor', text: 'themeBackgroundColorText', default: '#f8fafc' },
        { key: 'textColor', input: 'themeTextColor', text: 'themeTextColorText', default: '#1a202c' },
        { key: 'borderColor', input: 'themeBorderColor', text: 'themeBorderColorText', default: '#e2e8f0' },
        { key: 'mutedColor', input: 'themeMutedColor', text: 'themeMutedColorText', default: '#718096' }
      ];

      colorMappings.forEach(({ key, input, text, default: defaultValue }) => {
        const colorValue = brandingData[key] || defaultValue;
        const colorInput = document.getElementById(input);
        const textInput = document.getElementById(text);
        
        if (colorInput) colorInput.value = colorValue;
        if (textInput) textInput.value = colorValue;
        
        this.updateColorPreview(input, colorValue);
      });

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
    } catch (error) {
      console.error('SupabaseThemeEditor: Error loading current theme:', error);
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

  updateColorPreview(inputId, colorValue) {
    // Update color preview swatches
    const previewId = inputId.replace('theme', '').replace('Color', '') + 'ColorPreview';
    const previewElement = document.getElementById(previewId);
    if (previewElement) {
      const swatch = previewElement.querySelector('.preview-swatch');
      if (swatch) {
        swatch.style.backgroundColor = colorValue;
      }
    }
  }

  previewThemeChanges() {
    // Get current form values
    const orgName = document.getElementById('themeOrgName')?.value || '';
    const orgDescription = document.getElementById('themeOrgDescription')?.value || '';
    const primaryColor = document.getElementById('themePrimaryColor')?.value || '#ff5a00';
    const secondaryColor = document.getElementById('themeSecondaryColor')?.value || '#e53e3e';
    const backgroundColor = document.getElementById('themeBackgroundColor')?.value || '#f8fafc';
    const textColor = document.getElementById('themeTextColor')?.value || '#1a202c';
    const borderColor = document.getElementById('themeBorderColor')?.value || '#e2e8f0';
    const mutedColor = document.getElementById('themeMutedColor')?.value || '#718096';

    // Update header immediately with real-time preview
    const orgNameElement = document.getElementById('orgName');
    const orgDescriptionElement = document.getElementById('orgDescription');
    
    if (orgNameElement) {
      const displayName = orgName || 'Organization Chart';
      console.log('SupabaseThemeEditor: Preview update - changing org name to:', displayName);
      orgNameElement.textContent = displayName;
    }
    
    if (orgDescriptionElement) {
      const displayDescription = orgDescription || 'Visualize and manage your organization structure';
      console.log('SupabaseThemeEditor: Preview update - changing org description to:', displayDescription);
      orgDescriptionElement.textContent = displayDescription;
    }

    // Apply color previews to the main interface
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    document.documentElement.style.setProperty('--brand-orange', primaryColor);
    document.documentElement.style.setProperty('--brand-red', secondaryColor);
    document.documentElement.style.setProperty('--brand-gradient', 
      `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`);
    document.documentElement.style.setProperty('--surface', '#ffffff');
    document.documentElement.style.setProperty('--border', borderColor);
    document.documentElement.style.setProperty('--text', textColor);
    document.documentElement.style.setProperty('--muted', mutedColor);
    
    // Update body background
    document.body.style.background = backgroundColor;

    // Update live preview in theme editor
    this.updateLivePreview({
      primaryColor,
      secondaryColor,
      backgroundColor,
      textColor,
      borderColor,
      mutedColor
    });
  }

  updateLivePreview(colors) {
    // Update preview header background
    const previewHeader = document.querySelector('.preview-header');
    if (previewHeader) {
      previewHeader.style.background = `linear-gradient(135deg, ${colors.primaryColor} 0%, ${colors.secondaryColor} 100%)`;
    }

    // Update preview buttons
    const primaryBtn = document.querySelector('.preview-btn.primary');
    if (primaryBtn) {
      primaryBtn.style.background = `linear-gradient(135deg, ${colors.primaryColor} 0%, ${colors.secondaryColor} 100%)`;
    }

    const secondaryBtn = document.querySelector('.preview-btn.secondary');
    if (secondaryBtn) {
      secondaryBtn.style.color = colors.primaryColor;
      secondaryBtn.style.borderColor = colors.primaryColor;
      secondaryBtn.style.background = `rgba(${this.hexToRgb(colors.primaryColor)}, 0.1)`;
    }

    // Update preview card
    const previewCard = document.querySelector('.preview-card');
    if (previewCard) {
      previewCard.style.borderColor = colors.borderColor;
    }

    const previewCardText = previewCard?.querySelector('h5');
    if (previewCardText) {
      previewCardText.style.color = colors.textColor;
    }

    const previewCardMuted = previewCard?.querySelector('p');
    if (previewCardMuted) {
      previewCardMuted.style.color = colors.mutedColor;
    }

    // Update preview badge
    const previewBadge = document.querySelector('.preview-badge');
    if (previewBadge) {
      previewBadge.style.background = colors.primaryColor;
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '255, 90, 0';
  }

  async handleThemeSubmit(e) {
    e.preventDefault();
    
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (!currentOrgId) {
      console.error('SupabaseThemeEditor: No current organization found');
      return;
    }

    const formData = new FormData(e.target);
    
    try {
      // Update organization data in Supabase
      const orgUpdates = {
        name: formData.get('orgName'),
        description: formData.get('orgDescription')
      };

      // Update branding data
      const brandingData = {
        primaryColor: formData.get('primaryColor'),
        secondaryColor: formData.get('secondaryColor'),
        backgroundColor: formData.get('backgroundColor'),
        textColor: formData.get('textColor'),
        borderColor: formData.get('borderColor'),
        mutedColor: formData.get('mutedColor'),
        fontFamily: formData.get('fontFamily'),
        fontSize: formData.get('fontSize'),
        logo: null
      };

      // Handle logo upload
      const logoFile = formData.get('orgLogo');
      if (logoFile && logoFile.size > 0) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          brandingData.logo = e.target.result;
          await this.saveThemeAndApply(orgUpdates, brandingData);
        };
        reader.readAsDataURL(logoFile);
      } else {
        // Keep existing logo if no new one uploaded
        try {
          const existingOrg = await window.orgDb.getOrganization(currentOrgId);
          brandingData.logo = existingOrg.branding?.logo;
        } catch (error) {
          console.error('SupabaseThemeEditor: Error getting existing logo:', error);
        }
        await this.saveThemeAndApply(orgUpdates, brandingData);
      }
    } catch (error) {
      console.error('SupabaseThemeEditor: Error handling theme submit:', error);
      this.showErrorMessage('Error saving theme: ' + error.message);
    }
  }

  async saveThemeAndApply(orgUpdates, brandingData) {
    const currentOrgId = localStorage.getItem('current_organization_id');
    
    try {
      // Update organization in Supabase
      await window.orgDb.updateOrganization(currentOrgId, {
        ...orgUpdates,
        branding: brandingData
      });
      
      // Apply theme immediately
      this.applyTheme(brandingData, orgUpdates);
      
      // Ensure header is updated with the latest data
      await this.refreshHeader();
      
      // Hide modal
      this.hideEditThemeModal();
      
      // Show success message
      this.showSuccessMessage('Theme updated successfully!');
    } catch (error) {
      console.error('SupabaseThemeEditor: Error saving theme:', error);
      this.showErrorMessage('Error saving theme: ' + error.message);
    }
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

    // Apply all CSS custom properties
    document.documentElement.style.setProperty('--primary-color', brandingData.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', brandingData.secondaryColor);
    document.documentElement.style.setProperty('--brand-orange', brandingData.primaryColor);
    document.documentElement.style.setProperty('--brand-red', brandingData.secondaryColor);
    document.documentElement.style.setProperty('--brand-gradient', 
      `linear-gradient(135deg, ${brandingData.primaryColor} 0%, ${brandingData.secondaryColor} 100%)`);
    
    // Apply additional color properties
    if (brandingData.backgroundColor) {
      document.body.style.background = brandingData.backgroundColor;
    }
    if (brandingData.textColor) {
      document.documentElement.style.setProperty('--text', brandingData.textColor);
    }
    if (brandingData.borderColor) {
      document.documentElement.style.setProperty('--border', brandingData.borderColor);
    }
    if (brandingData.mutedColor) {
      document.documentElement.style.setProperty('--muted', brandingData.mutedColor);
    }

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

  showErrorMessage(message) {
    // Create or update error message
    let messageDiv = document.getElementById('themeMessage');
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.id = 'themeMessage';
      messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
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
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (messageDiv && messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 5000);
  }
}

// Initialize theme editor when DOM is ready
let themeEditorInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  themeEditorInstance = new SupabaseThemeEditor();
  
  // Make it globally accessible
  window.ThemeEditor = themeEditorInstance;
  
  // Also add debug method to window for easy access
  window.debugThemeEditor = () => {
    if (window.ThemeEditor) {
      console.log('SupabaseThemeEditor Debug State:');
      console.log('- Current Org ID:', localStorage.getItem('current_organization_id'));
      console.log('- Header Elements:', {
        orgName: document.getElementById('orgName'),
        orgDescription: document.getElementById('orgDescription')
      });
      console.log('- Current Header Text:', {
        orgName: document.getElementById('orgName')?.textContent || 'NOT FOUND',
        orgDescription: document.getElementById('orgDescription')?.textContent || 'NOT FOUND'
      });
    } else {
      console.log('SupabaseThemeEditor not initialized yet');
    }
  };
  
  // Add manual refresh method for testing
  window.refreshHeader = () => {
    if (window.ThemeEditor) {
      window.ThemeEditor.refreshHeader();
    } else {
      console.log('SupabaseThemeEditor not initialized yet');
    }
  };
});

// Also initialize when the main app loads (for cases where DOMContentLoaded already fired)
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're in the main app and initialize header
  const mainApp = document.getElementById("mainApp");
  if (mainApp && !mainApp.classList.contains("hidden")) {
    // Main app is visible, ensure header is initialized
    setTimeout(() => {
      if (window.ThemeEditor) {
        window.ThemeEditor.refreshHeader();
      }
    }, 100);
  }
});

export default SupabaseThemeEditor;
