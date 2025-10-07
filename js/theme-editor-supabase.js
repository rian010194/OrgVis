// Supabase-powered Theme Editor for Organization Chart
// Note: orgDb is made globally available by supabase-multi-org.js

class SupabaseThemeEditor {
  constructor() {
    this.init();
  }

  init() {
    console.log('SupabaseThemeEditor: Initializing...');
    console.log('SupabaseThemeEditor: window.orgDb available:', !!window.orgDb);
    console.log('SupabaseThemeEditor: window.supabase available:', !!window.supabase);
    
    // Test Supabase connection
    this.testSupabaseConnection();
    
    this.setupEventListeners();
    this.loadCurrentTheme();
    this.initializeHeader();
  }
  
  async testSupabaseConnection() {
    try {
      console.log('SupabaseThemeEditor: Testing Supabase connection...');
      if (window.orgDb && window.orgDb.supabase) {
        const { data, error } = await window.orgDb.supabase
          .from('organizations')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error('SupabaseThemeEditor: Supabase connection error:', error);
        } else {
          console.log('SupabaseThemeEditor: Supabase connection successful:', data);
        }
      } else {
        console.error('SupabaseThemeEditor: orgDb or supabase not available');
      }
    } catch (error) {
      console.error('SupabaseThemeEditor: Error testing Supabase connection:', error);
    }
  }

  setupEventListeners() {
    // Note: Edit Theme button event listener is handled by ui.js
    // to avoid duplicate event listeners

    // Modal close buttons
    const closeThemeBtn = document.getElementById('closeThemeBtn');
    const cancelThemeBtn = document.getElementById('cancelThemeBtn');
    
    if (closeThemeBtn) {
      closeThemeBtn.addEventListener('click', () => this.hideEditThemeModal());
    }
    
    if (cancelThemeBtn) {
      cancelThemeBtn.addEventListener('click', () => this.hideEditThemeModal());
    }

    // Save button click handler (no form submission needed)
    // Use event delegation on document to catch clicks anywhere
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'saveThemeBtn') {
        e.preventDefault();
        e.stopPropagation();
        console.log('SupabaseThemeEditor: ========== SAVE THEME BUTTON CLICKED (via event delegation) ==========');
        
        const editThemeForm = document.getElementById('editThemeForm');
        if (editThemeForm) {
          this.handleThemeSubmit({ 
            target: editThemeForm,
            preventDefault: () => {},
            stopPropagation: () => {}
          });
        } else {
          console.error('SupabaseThemeEditor: editThemeForm container not found!');
        }
      }
    });
    console.log('SupabaseThemeEditor: Event delegation listener attached for saveThemeBtn');
    
    // Also attach direct listener as backup
    this.attachSaveButtonListener();
    
    // And try after a delay
    setTimeout(() => {
      this.attachSaveButtonListener();
    }, 500);

    // Color input synchronization
    this.setupColorInputSync();
    this.setupThemePresets();
    
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
      // Check if orgDb is available
      if (!window.orgDb || typeof window.orgDb.getOrganization !== 'function') {
        console.log('SupabaseThemeEditor: orgDb not available for header init, retrying in 100ms');
        setTimeout(() => {
          this.initializeHeader();
        }, 100);
        return;
      }

      try {
        const orgData = await window.orgDb.getOrganization(currentOrgId);
        console.log('SupabaseThemeEditor: Org data from Supabase:', orgData);
        
        // Update header (find elements in main app header)
        const mainApp = document.getElementById('mainApp');
        const mainAppHeader = mainApp ? mainApp.querySelector('header') : null;
        const orgNameElement = mainAppHeader ? mainAppHeader.querySelector('#orgName') : null;
        const orgDescriptionElement = mainAppHeader ? mainAppHeader.querySelector('#orgDescription') : null;
        
        console.log('SupabaseThemeEditor: Header elements found:', {
          mainApp: !!mainApp,
          mainAppHeader: !!mainAppHeader,
          orgName: !!orgNameElement,
          orgDescription: !!orgDescriptionElement,
          orgData: orgData
        });
        
        if (orgNameElement && orgData && orgData.name) {
          console.log('SupabaseThemeEditor: Updating org name from', orgNameElement.textContent, 'to', orgData.name);
          orgNameElement.textContent = orgData.name;
        }
        
        if (orgDescriptionElement && orgData && orgData.description) {
          console.log('SupabaseThemeEditor: Updating org description from', orgDescriptionElement.textContent, 'to', orgData.description);
          orgDescriptionElement.textContent = orgData.description;
        }

        // Apply branding if available (but only if we're in main app)
        if (orgData.branding && (orgData.branding.primaryColor || orgData.branding.secondaryColor)) {
          console.log('SupabaseThemeEditor: Applying branding with logo:', orgData.branding.logo);
          this.applyTheme(orgData.branding, orgData);
        } else {
          console.log('SupabaseThemeEditor: No branding data found for organization');
        }
      } catch (error) {
        console.error('SupabaseThemeEditor: Error loading organization data:', error);
        
        // Handle specific "organization not found" error
        if (error.message.includes('Cannot coerce the result to a single JSON object')) {
          console.error('SupabaseThemeEditor: Organization does not exist:', currentOrgId);
          // Clear invalid organization ID
          localStorage.removeItem('current_organization_id');
          // Don't automatically load another organization - let user choose from landing page
          return;
        }
        
        // Don't try fallback organizations - let user choose from landing page
        console.error('SupabaseThemeEditor: Error loading organization data:', error);
      }
    } else {
      // No current org ID, don't automatically load any organization
      console.log('SupabaseThemeEditor: No current organization ID, not initializing header');
    }
  }

  // Helper method to load a valid organization (removed - no longer needed)
  // async loadValidOrganization() { ... }

  // Public method to refresh header from external calls
  async refreshHeader() {
    console.log('SupabaseThemeEditor: Refreshing header...');
    await this.initializeHeader();
  }

  // Update header in real-time as user types
  updateHeaderInRealTime() {
    const orgNameInput = document.getElementById('themeOrgName');
    const orgDescriptionInput = document.getElementById('themeOrgDescription');
    
    // Find header elements in main app
    const mainApp = document.getElementById('mainApp');
    const mainAppHeader = mainApp ? mainApp.querySelector('header') : null;
    const orgNameElement = mainAppHeader ? mainAppHeader.querySelector('#orgName') : null;
    const orgDescriptionElement = mainAppHeader ? mainAppHeader.querySelector('#orgDescription') : null;
    
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
    // Use event delegation to handle color inputs even when cloned
    // This works for both original and cloned forms
    document.addEventListener('input', (e) => {
      const target = e.target;
      
      // Debug all input events in theme forms
      if (target.id && target.id.startsWith('theme')) {
        console.log('SupabaseThemeEditor: Input event detected:', {
          id: target.id,
          type: target.type,
          value: target.value,
          isColor: target.type === 'color'
        });
      }
      
      // Handle color picker inputs
      if (target.id && target.id.startsWith('theme') && target.type === 'color') {
        const textInputId = target.id + 'Text';
        // Find the corresponding text input in the same form container
        const formContainer = target.closest('#editThemeForm');
        const textInput = formContainer ? formContainer.querySelector(`#${textInputId}`) : document.getElementById(textInputId);
        
        if (textInput) {
          textInput.value = target.value;
          console.log(`Color picker changed: ${target.id} = ${target.value}`);
        }
        this.updateColorPreview(target.id, target.value);
        this.previewThemeChanges();
      }
      
      // Handle text inputs for colors
      if (target.id && target.id.endsWith('Text') && target.id.startsWith('theme')) {
        if (/^#[0-9A-F]{6}$/i.test(target.value)) {
          const colorInputId = target.id.replace('Text', '');
          // Find the corresponding color input in the same form container
          const formContainer = target.closest('#editThemeForm');
          const colorInput = formContainer ? formContainer.querySelector(`#${colorInputId}`) : document.getElementById(colorInputId);
          
          if (colorInput) {
            colorInput.value = target.value;
            console.log(`Text input changed: ${target.id} = ${target.value}`);
          }
          this.updateColorPreview(colorInputId, target.value);
          this.previewThemeChanges();
        }
      }
    });
    
    console.log('SupabaseThemeEditor: Color input sync set up with event delegation');

    // Setup theme presets
    this.setupThemePresets();

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
      // Ensure all color previews are initialized
      this.initializeColorPreviews();
      
      // Re-attach save button listener in case panel was cloned (force=true)
      setTimeout(() => {
        this.attachSaveButtonListener(true);
      }, 100);
    }
  }

  hideEditThemeModal() {
    const panel = document.getElementById('editThemePanel');
    if (panel) {
      panel.classList.add('hidden');
    }
    
    // Also check if theme editor is open in the detail panel
    const detailPanel = document.getElementById('detailPanel');
    if (detailPanel && detailPanel.querySelector('#editThemeForm')) {
      // Theme editor is in detail panel, close it properly
      console.log('SupabaseThemeEditor: Closing theme editor in detail panel');
      
      // Trigger the close-panel action
      const closeBtn = detailPanel.querySelector('[data-action="close-panel"]');
      if (closeBtn) {
        closeBtn.click();
      } else {
        // Fallback: manually close the detail panel
        detailPanel.classList.remove('active', 'expanded');
        detailPanel.style.display = 'none';
        document.body.classList.remove('detail-expanded');
        
        // Re-render the detail panel (if OrgUI is available)
        if (window.OrgUI && typeof window.OrgUI.renderDetailPanel === 'function') {
          window.OrgUI.renderDetailPanel();
        }
      }
    }
  }

  async loadCurrentTheme(container = null) {
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (!currentOrgId) {
      // Don't automatically load any organization - user should choose from landing page
      console.log('SupabaseThemeEditor: No current organization ID, not loading theme');
      return;
    }

    // Check if orgDb is available
    if (!window.orgDb || typeof window.orgDb.getOrganization !== 'function') {
      console.log('SupabaseThemeEditor: orgDb not available, retrying in 100ms');
      console.log('SupabaseThemeEditor: window.orgDb:', window.orgDb);
      console.log('SupabaseThemeEditor: typeof window.orgDb:', typeof window.orgDb);
      setTimeout(() => {
        this.loadCurrentTheme(container);
      }, 100);
      return;
    }
    
    console.log('SupabaseThemeEditor: orgDb is available, proceeding with loadCurrentTheme');
    console.log('SupabaseThemeEditor: Container provided:', !!container);

    try {
      console.log('SupabaseThemeEditor: Attempting to load organization data from Supabase...');
      // Load organization data from Supabase
      const orgData = await window.orgDb.getOrganization(currentOrgId);
      console.log('SupabaseThemeEditor: Successfully loaded org data:', orgData);
      const brandingData = orgData.branding || {};
      console.log('SupabaseThemeEditor: Branding data:', brandingData);

      // Helper to get element (from container if provided, or globally)
      const getElement = (id) => {
        if (container) {
          return container.querySelector(`#${id}`);
        }
        return document.getElementById(id);
      };

      // Update form fields
      const orgNameInput = getElement('themeOrgName');
      const orgDescriptionInput = getElement('themeOrgDescription');
      
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
        { key: 'mutedColor', input: 'themeMutedColor', text: 'themeMutedColorText', default: '#718096' },
        { key: 'nodeBackgroundColor', input: 'themeNodeBackgroundColor', text: 'themeNodeBackgroundColorText', default: '#ffffff' },
        { key: 'buttonBackgroundColor', input: 'themeButtonBackgroundColor', text: 'themeButtonBackgroundColorText', default: '#ffffff' },
        { key: 'accentBackgroundColor', input: 'themeAccentBackgroundColor', text: 'themeAccentBackgroundColorText', default: '#ffe6d5' },
        { key: 'treeItemBackgroundColor', input: 'themeTreeItemBackgroundColor', text: 'themeTreeItemBackgroundColorText', default: '#fff4ed' },
        { key: 'hoverColor', input: 'themeHoverColor', text: 'themeHoverColorText', default: '#ff5a00' },
        { key: 'selectedColor', input: 'themeSelectedColor', text: 'themeSelectedColorText', default: '#ff5a00' },
        { key: 'nodeStrokeColor', input: 'themeNodeStrokeColor', text: 'themeNodeStrokeColorText', default: '#ff5a00' }
      ];

      colorMappings.forEach(({ key, input, text, default: defaultValue }) => {
        const colorValue = brandingData[key] || defaultValue;
        const colorInput = getElement(input);
        const textInput = getElement(text);
        
        if (colorInput) {
          colorInput.value = colorValue;
          console.log(`SupabaseThemeEditor: Set ${input} to ${colorValue}`);
        }
        if (textInput) {
          textInput.value = colorValue;
        }
        
        this.updateColorPreview(input, colorValue);
      });

      // Update font family and size
      const fontFamilySelect = getElement('themeFontFamily');
      const fontSizeSelect = getElement('themeFontSize');

      if (fontFamilySelect) {
        fontFamilySelect.value = brandingData.fontFamily || 'system';
      }
      
      if (fontSizeSelect) {
        fontSizeSelect.value = brandingData.fontSize || '16';
      }

      // Update logo preview
      if (brandingData.logo) {
        const logoPreview = getElement('themeLogoPreview');
        if (logoPreview) {
          logoPreview.innerHTML = `<img src="${brandingData.logo}" alt="Organization Logo" style="max-width: 100px; max-height: 60px;">`;
        }
      }
      
      console.log('SupabaseThemeEditor: Theme loaded into form successfully');
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

  initializeColorPreviews() {
    // Initialize all color preview swatches with current values
    const colorInputs = [
      { id: 'themePrimaryColor', previewId: 'primaryColorPreview' },
      { id: 'themeSecondaryColor', previewId: 'secondaryColorPreview' }
    ];
    
    colorInputs.forEach(({ id, previewId }) => {
      const input = document.getElementById(id);
      if (input && input.value) {
        this.updateColorPreview(id, input.value);
      }
    });
  }

  updateColorPreview(inputId, colorValue) {
    // Update color preview swatches
    // Convert themePrimaryColor -> primaryColorPreview
    // Convert themeSecondaryColor -> secondaryColorPreview
    let previewId;
    if (inputId === 'themePrimaryColor') {
      previewId = 'primaryColorPreview';
    } else if (inputId === 'themeSecondaryColor') {
      previewId = 'secondaryColorPreview';
    } else {
      // For other colors, try to construct the ID
      previewId = inputId.replace('theme', '').toLowerCase() + 'Preview';
    }
    
    const previewElement = document.getElementById(previewId);
    if (previewElement) {
      const swatch = previewElement.querySelector('.preview-swatch');
      if (swatch) {
        swatch.style.backgroundColor = colorValue;
        console.log('Updated color preview:', previewId, colorValue);
      } else {
        console.log('Preview swatch not found for:', previewId);
      }
    } else {
      console.log('Preview element not found:', previewId);
    }
  }

  attachSaveButtonListener(force = false) {
    const saveThemeBtn = document.getElementById('saveThemeBtn');
    
    console.log('SupabaseThemeEditor: Looking for saveThemeBtn...', {
      found: !!saveThemeBtn,
      force: force,
      hasDataset: saveThemeBtn ? !!saveThemeBtn.dataset.listenerAttached : false,
      allButtons: document.querySelectorAll('button').length,
      buttonIds: Array.from(document.querySelectorAll('button')).map(b => b.id).filter(id => id)
    });
    
    if (saveThemeBtn) {
      // Check if listener already attached (but allow force override)
      if (!force && saveThemeBtn.dataset.listenerAttached) {
        console.log('SupabaseThemeEditor: Save button listener already attached, skipping (use force=true to override)');
        return;
      }
      
      // Remove the old listener flag if forcing re-attachment
      if (force && saveThemeBtn.dataset.listenerAttached) {
        console.log('SupabaseThemeEditor: Forcing re-attachment, removing old marker');
        delete saveThemeBtn.dataset.listenerAttached;
      }
      
      console.log('SupabaseThemeEditor: Found saveThemeBtn, attaching click listener...');
      
      saveThemeBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event from bubbling
        
        console.log('SupabaseThemeEditor: ========== SAVE THEME BUTTON CLICKED ==========');
        console.log('SupabaseThemeEditor: Button:', e.target);
        
        // Get the form container
        const editThemeForm = document.getElementById('editThemeForm');
        if (editThemeForm) {
          // Trigger the theme submit handler
          this.handleThemeSubmit({ 
            target: editThemeForm,
            preventDefault: () => {},
            stopPropagation: () => {}
          });
        } else {
          console.error('SupabaseThemeEditor: editThemeForm container not found!');
        }
      });
      
      // Mark as attached
      saveThemeBtn.dataset.listenerAttached = 'true';
      console.log('SupabaseThemeEditor: Save button click listener attached successfully');
    } else {
      console.warn('SupabaseThemeEditor: WARNING - saveThemeBtn not found! Available button IDs:', 
        Array.from(document.querySelectorAll('button')).map(b => b.id).filter(id => id).join(', '));
    }
  }

  setupThemePresets() {
    // Use event delegation for preset dropdowns (works with cloned forms)
    document.addEventListener('change', (e) => {
      const target = e.target;
      
      // Handle both themePreset and themePreset2 dropdowns
      if (target.id === 'themePreset' || target.id === 'themePreset2') {
        console.log('SupabaseThemeEditor: Theme preset changed to:', target.value);
        const selectedTheme = this.getThemePresets()[target.value];
        if (selectedTheme) {
          // Find the form container to apply changes to the correct form
          const formContainer = target.closest('#editThemeForm');
          this.applyThemePreset(selectedTheme, formContainer);
        }
      }
    });
    
    console.log('SupabaseThemeEditor: Theme preset event delegation set up');
  }
  
  getThemePresets() {
    return {
      orange: {
        primaryColor: '#ff5a00',
        secondaryColor: '#e53e3e',
        backgroundColor: '#f8fafc',
        textColor: '#1a202c',
        borderColor: '#e2e8f0',
        mutedColor: '#718096',
        nodeBackgroundColor: '#ffffff',
        buttonBackgroundColor: '#ffffff',
        accentBackgroundColor: '#ffe6d5',
        treeItemBackgroundColor: '#fff4ed',
        hoverColor: '#ff5a00',
        selectedColor: '#ff5a00',
        nodeStrokeColor: '#ff5a00'
      },
      blue: {
        primaryColor: '#2563eb',
        secondaryColor: '#1d4ed8',
        backgroundColor: '#f8fafc',
        textColor: '#1a202c',
        borderColor: '#e2e8f0',
        mutedColor: '#718096',
        nodeBackgroundColor: '#ffffff',
        buttonBackgroundColor: '#ffffff',
        accentBackgroundColor: '#dbeafe',
        treeItemBackgroundColor: '#eff6ff',
        hoverColor: '#2563eb',
        selectedColor: '#2563eb',
        nodeStrokeColor: '#2563eb'
      },
      green: {
        primaryColor: '#059669',
        secondaryColor: '#047857',
        backgroundColor: '#f8fafc',
        textColor: '#1a202c',
        borderColor: '#e2e8f0',
        mutedColor: '#718096',
        nodeBackgroundColor: '#ffffff',
        buttonBackgroundColor: '#ffffff',
        accentBackgroundColor: '#d1fae5',
        treeItemBackgroundColor: '#ecfdf5',
        hoverColor: '#059669',
        selectedColor: '#059669',
        nodeStrokeColor: '#059669'
      },
      purple: {
        primaryColor: '#7c3aed',
        secondaryColor: '#6d28d9',
        backgroundColor: '#f8fafc',
        textColor: '#1a202c',
        borderColor: '#e2e8f0',
        mutedColor: '#718096',
        nodeBackgroundColor: '#ffffff',
        buttonBackgroundColor: '#ffffff',
        accentBackgroundColor: '#e9d5ff',
        treeItemBackgroundColor: '#f3e8ff',
        hoverColor: '#7c3aed',
        selectedColor: '#7c3aed',
        nodeStrokeColor: '#7c3aed'
      },
      red: {
        primaryColor: '#dc2626',
        secondaryColor: '#b91c1c',
        backgroundColor: '#f8fafc',
        textColor: '#1a202c',
        borderColor: '#e2e8f0',
        mutedColor: '#718096',
        nodeBackgroundColor: '#ffffff',
        buttonBackgroundColor: '#ffffff',
        accentBackgroundColor: '#fecaca',
        treeItemBackgroundColor: '#fef2f2',
        hoverColor: '#dc2626',
        selectedColor: '#dc2626',
        nodeStrokeColor: '#dc2626'
      },
      dark: {
        primaryColor: '#f59e0b',
        secondaryColor: '#d97706',
        backgroundColor: '#111827',
        textColor: '#f9fafb',
        borderColor: '#374151',
        mutedColor: '#9ca3af',
        nodeBackgroundColor: '#1f2937',
        buttonBackgroundColor: '#1f2937',
        accentBackgroundColor: '#451a03',
        treeItemBackgroundColor: '#1c1917',
        hoverColor: '#f59e0b',
        selectedColor: '#f59e0b',
        nodeStrokeColor: '#f59e0b'
      }
    };
  }

  applyThemePreset(theme, container = null) {
    console.log('SupabaseThemeEditor: Applying theme preset:', theme);
    
    // Helper to get element (from container if provided, or globally)
    const getElement = (id) => {
      if (container) {
        return container.querySelector(`#${id}`);
      }
      return document.getElementById(id);
    };
    
    // Apply colors to form inputs
    Object.keys(theme).forEach(key => {
      const inputId = `theme${key.charAt(0).toUpperCase() + key.slice(1)}`;
      const textInputId = inputId + 'Text';
      
      const colorInput = getElement(inputId);
      const textInput = getElement(textInputId);
      
      if (colorInput) {
        colorInput.value = theme[key];
        console.log(`Set ${inputId} = ${theme[key]}`);
      }
      if (textInput) {
        textInput.value = theme[key];
      }
    });

    // Update preview boxes
    this.updateThemePreview(theme);
    
    // Update CSS variables immediately
    document.documentElement.style.setProperty('--brand-orange', theme.primaryColor);
    document.documentElement.style.setProperty('--brand-red', theme.secondaryColor);
    document.documentElement.style.setProperty('--hover-color', theme.hoverColor);
    document.documentElement.style.setProperty('--selected-color', theme.selectedColor);
    document.documentElement.style.setProperty('--accent-background', theme.accentBackgroundColor);
    document.documentElement.style.setProperty('--tree-item-background', theme.treeItemBackgroundColor);
    document.documentElement.style.setProperty('--button-background', theme.buttonBackgroundColor);
    document.documentElement.style.setProperty('--node-background', theme.nodeBackgroundColor);
    
    // Update opacity-based colors
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    document.documentElement.style.setProperty('--accent-light', hexToRgba(theme.primaryColor, 0.08));
    document.documentElement.style.setProperty('--accent-medium', hexToRgba(theme.primaryColor, 0.1));
    document.documentElement.style.setProperty('--accent-dark', hexToRgba(theme.primaryColor, 0.15));
    document.documentElement.style.setProperty('--accent-darker', hexToRgba(theme.primaryColor, 0.25));
    document.documentElement.style.setProperty('--accent-darkest', hexToRgba(theme.primaryColor, 0.3));
    document.documentElement.style.setProperty('--brand-light-opacity', hexToRgba(theme.primaryColor, 0.06));
    document.documentElement.style.setProperty('--brand-medium-opacity', hexToRgba(theme.primaryColor, 0.55));
    document.documentElement.style.setProperty('--brand-strong-opacity', hexToRgba(theme.primaryColor, 0.7));
    
    console.log('Theme preset applied:', theme);
    console.log('CSS variables updated immediately');
  }

  updateThemePreview(theme) {
    // Update the theme preview boxes
    const primaryPreview = document.querySelector('.primary-preview');
    const secondaryPreview = document.querySelector('.secondary-preview');
    const hoverPreview = document.querySelector('.hover-preview');
    const selectedPreview = document.querySelector('.selected-preview');
    
    if (primaryPreview) primaryPreview.style.background = theme.primaryColor;
    if (secondaryPreview) secondaryPreview.style.background = theme.secondaryColor;
    if (hoverPreview) hoverPreview.style.background = theme.hoverColor;
    if (selectedPreview) selectedPreview.style.background = theme.selectedColor;
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
    // Note: e.preventDefault() is already called in the event listener
    
    console.log('SupabaseThemeEditor: Starting theme submit...');
    console.log('SupabaseThemeEditor: Form element:', e.target);
    console.log('SupabaseThemeEditor: Form ID:', e.target.id);
    
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (!currentOrgId) {
      console.error('SupabaseThemeEditor: No current organization found');
      this.showErrorMessage('No organization found. Please refresh the page.');
      return;
    }
    
    console.log('SupabaseThemeEditor: Current org ID:', currentOrgId);

    // Manually collect form values from the SPECIFIC form container (not by global ID)
    // This avoids duplicate ID issues when form is cloned
    const formContainer = e.target;
    
    const getValue = (id) => {
      // Use querySelectorAll to get ALL elements with this ID
      const allElements = document.querySelectorAll(`#${id}`);
      let element = null;
      
      // Priority 1: Find element in detail panel (if theme editor is there)
      const detailPanel = document.getElementById('detailPanel');
      if (detailPanel) {
        for (let el of allElements) {
          if (detailPanel.contains(el)) {
            element = el;
            console.log(`Found ${id} in detail panel`);
            break;
          }
        }
      }
      
      // Priority 2: Find element in our form container
      if (!element) {
        for (let el of allElements) {
          if (formContainer.contains(el)) {
            element = el;
            console.log(`Found ${id} in form container`);
            break;
          }
        }
      }
      
      // Priority 3: Just use the last one (most recently added/cloned)
      if (!element && allElements.length > 0) {
        element = allElements[allElements.length - 1];
        console.log(`Using last ${id} (fallback)`);
      }
      
      const value = element ? element.value : null;
      console.log(`Getting value for ${id}: ${value}`);
      return value;
    };
    
    // Collect organization data
    const orgName = getValue('themeOrgName');
    const orgDescription = getValue('themeOrgDescription');
    
    // Collect all color values
    const primaryColor = getValue('themePrimaryColor');
    const secondaryColor = getValue('themeSecondaryColor');
    const backgroundColor = getValue('themeBackgroundColor');
    const textColor = getValue('themeTextColor');
    const borderColor = getValue('themeBorderColor');
    const mutedColor = getValue('themeMutedColor');
    const nodeBackgroundColor = getValue('themeNodeBackgroundColor');
    const buttonBackgroundColor = getValue('themeButtonBackgroundColor');
    const accentBackgroundColor = getValue('themeAccentBackgroundColor');
    const treeItemBackgroundColor = getValue('themeTreeItemBackgroundColor');
    const hoverColor = getValue('themeHoverColor');
    const selectedColor = getValue('themeSelectedColor');
    const nodeStrokeColor = getValue('themeNodeStrokeColor');
    const fontFamily = getValue('themeFontFamily');
    const fontSize = getValue('themeFontSize');
    
    console.log('SupabaseThemeEditor: Collected form values:', {
      orgName,
      orgDescription,
      primaryColor,
      secondaryColor,
      fontFamily,
      fontSize
    });
    
    try {
      // Update organization data in Supabase - DON'T overwrite with empty values
      const orgUpdates = {};
      
      // Only update name if it has a value
      if (orgName && orgName.trim()) {
        orgUpdates.name = orgName.trim();
      }
      
      // Only update description if it has a value  
      if (orgDescription && orgDescription.trim()) {
        orgUpdates.description = orgDescription.trim();
      }
      
      console.log('SupabaseThemeEditor: Organization updates (non-empty only):', orgUpdates);

      // Update branding data - ensure all values are valid
      const brandingData = {
        primaryColor: primaryColor || '#ff5a00',
        secondaryColor: secondaryColor || '#e53e3e',
        backgroundColor: backgroundColor || '#f8fafc',
        textColor: textColor || '#1a202c',
        borderColor: borderColor || '#e2e8f0',
        mutedColor: mutedColor || '#718096',
        nodeBackgroundColor: nodeBackgroundColor || '#ffffff',
        buttonBackgroundColor: buttonBackgroundColor || '#ffffff',
        accentBackgroundColor: accentBackgroundColor || '#ffe6d5',
        treeItemBackgroundColor: treeItemBackgroundColor || '#fff4ed',
        hoverColor: hoverColor || '#ff5a00',
        selectedColor: selectedColor || '#ff5a00',
        nodeStrokeColor: nodeStrokeColor || '#ff5a00',
        fontFamily: fontFamily || 'system',
        fontSize: fontSize || '16',
        logo: null
      };
      
      console.log('SupabaseThemeEditor: Created objects:', {
        orgUpdates,
        brandingData,
        currentOrgId
      });

      // Handle logo upload (query within form container to avoid duplicate ID issue)
      const logoInput = formContainer.querySelector('#themeOrgLogo');
      const logoFile = logoInput && logoInput.files ? logoInput.files[0] : null;
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
    console.log('SupabaseThemeEditor: saveThemeAndApply called with:', { orgUpdates, brandingData });
    
    const currentOrgId = localStorage.getItem('current_organization_id');
    
    if (!currentOrgId) {
      console.error('SupabaseThemeEditor: No current organization ID found');
      this.showErrorMessage('No organization found. Please refresh the page.');
      return;
    }
    
    console.log('SupabaseThemeEditor: Saving theme for org ID:', currentOrgId);
    
    try {
      // Validate data before saving
      if (!orgUpdates || !brandingData) {
        throw new Error('Invalid theme data');
      }
      
      // Check if orgDb is available
      if (!window.orgDb || typeof window.orgDb.updateOrganization !== 'function') {
        throw new Error('Supabase database not available. Please check your configuration.');
      }
      
      // First, check if organization exists
      try {
        const existingOrg = await window.orgDb.getOrganization(currentOrgId);
        if (!existingOrg) {
          console.error('SupabaseThemeEditor: Organization not found in database:', currentOrgId);
          this.showErrorMessage('Organization not found. Please create a new organization or refresh the page.');
          // Clear invalid organization ID
          localStorage.removeItem('current_organization_id');
          return;
        }
        console.log('SupabaseThemeEditor: Organization found:', existingOrg);
      } catch (checkError) {
        if (checkError.message.includes('Cannot coerce the result to a single JSON object')) {
          console.error('SupabaseThemeEditor: Organization does not exist:', currentOrgId);
          this.showErrorMessage('Organization not found in database. Please create a new organization or refresh the page.');
          // Clear invalid organization ID
          localStorage.removeItem('current_organization_id');
          return;
        }
        throw checkError; // Re-throw if it's a different error
      }
      
      // Update organization in Supabase
      console.log('SupabaseThemeEditor: About to update organization with data:', {
        currentOrgId,
        updateData: {
          ...orgUpdates,
          branding: brandingData
        }
      });
      
      await window.orgDb.updateOrganization(currentOrgId, {
        ...orgUpdates,
        branding: brandingData
      });
      
      console.log('SupabaseThemeEditor: Successfully updated organization');
      
      // Apply theme immediately
      this.applyTheme(brandingData, orgUpdates);
      
      // Ensure header is updated with the latest data
      await this.refreshHeader();
      
      // Force a refresh of the org chart to apply new colors
      if (window.OrgChart && typeof window.OrgChart.refresh === 'function') {
        console.log('SupabaseThemeEditor: Refreshing org chart to apply new theme');
        window.OrgChart.refresh();
      }

      // Don't force main app to be visible - let user choose from landing page
      // try {
      //   const landingPage = document.getElementById('landingPage');
      //   const mainApp = document.getElementById('mainApp');
      //   if (landingPage) landingPage.classList.add('hidden');
      //   if (mainApp) mainApp.classList.remove('hidden');
      // } catch (_) {}

      // Hide modal
      this.hideEditThemeModal();
      
      // Show success message
      this.showSuccessMessage('Theme updated successfully!');
    } catch (error) {
      console.error('SupabaseThemeEditor: Error saving theme:', error);
      console.error('Error details:', {
        currentOrgId,
        orgUpdates,
        brandingData,
        error: error.message
      });
      
      // Handle specific Supabase errors
      if (error.message.includes('Cannot coerce the result to a single JSON object')) {
        this.showErrorMessage('Organization not found in database. Please refresh the page and try again.');
        // Clear invalid organization ID
        localStorage.removeItem('current_organization_id');
      } else {
        this.showErrorMessage('Error saving theme: ' + error.message);
      }
    }
  }

  applyTheme(brandingData, orgData) {
    // Apply branding to main app header if present (even if landing page is visible)
    const landingPage = document.getElementById('landingPage');
    const mainApp = document.getElementById('mainApp');
    
    // Always try to apply to main app if it exists
    if (!mainApp) {
      console.log('SupabaseThemeEditor: Skipping theme application - main app not found');
      return;
    }
    // Don't automatically show main app - let user choose from landing page
    // try {
    //   if (landingPage && !landingPage.classList.contains('hidden')) {
    //     landingPage.classList.add('hidden');
    //     mainApp.classList.remove('hidden');
    //   }
    // } catch (_) {}
    
    console.log('SupabaseThemeEditor: Applying theme to main app');
    
    // Update header with organization info (find elements in main app header)
    const mainAppHeader = mainApp.querySelector('header');
    const orgNameElement = mainAppHeader ? mainAppHeader.querySelector('#orgName') : null;
    const orgDescriptionElement = mainAppHeader ? mainAppHeader.querySelector('#orgDescription') : null;
    
    console.log('SupabaseThemeEditor: Header elements found:', {
      mainAppHeader: !!mainAppHeader,
      orgNameElement: !!orgNameElement,
      orgDescriptionElement: !!orgDescriptionElement,
      orgData: orgData
    });
    
    if (orgNameElement && orgData && orgData.name) {
      console.log('SupabaseThemeEditor: Updating org name from', orgNameElement.textContent, 'to', orgData.name);
      orgNameElement.textContent = orgData.name;
    }
    
    if (orgDescriptionElement && orgData && orgData.description) {
      console.log('SupabaseThemeEditor: Updating org description from', orgDescriptionElement.textContent, 'to', orgData.description);
      orgDescriptionElement.textContent = orgData.description;
    }

    // Apply all CSS custom properties
    document.documentElement.style.setProperty('--primary-color', brandingData.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', brandingData.secondaryColor);
    document.documentElement.style.setProperty('--brand-orange', brandingData.primaryColor);
    document.documentElement.style.setProperty('--brand-red', brandingData.secondaryColor);
    document.documentElement.style.setProperty('--brand-gradient', 
      `linear-gradient(135deg, ${brandingData.primaryColor} 0%, ${brandingData.secondaryColor} 100%)`);
    
    console.log('SupabaseThemeEditor: Applying colors:', {
      primary: brandingData.primaryColor,
      secondary: brandingData.secondaryColor,
      hover: brandingData.hoverColor,
      selected: brandingData.selectedColor
    });
    
    // Apply additional color properties
    if (brandingData.backgroundColor) {
      document.body.style.background = brandingData.backgroundColor;
      document.documentElement.style.setProperty('--surface', brandingData.backgroundColor);
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
    if (brandingData.nodeBackgroundColor) {
      document.documentElement.style.setProperty('--node-background', brandingData.nodeBackgroundColor);
    }
    if (brandingData.buttonBackgroundColor) {
      document.documentElement.style.setProperty('--button-background', brandingData.buttonBackgroundColor);
    }
    if (brandingData.accentBackgroundColor) {
      document.documentElement.style.setProperty('--accent-background', brandingData.accentBackgroundColor);
    }
    if (brandingData.treeItemBackgroundColor) {
      document.documentElement.style.setProperty('--tree-item-background', brandingData.treeItemBackgroundColor);
    }
    // CRITICAL: Set hover and selected colors (these control button/element interactions)
    if (brandingData.hoverColor) {
      document.documentElement.style.setProperty('--hover-color', brandingData.hoverColor);
      console.log('SupabaseThemeEditor: Set --hover-color to', brandingData.hoverColor);
    }
    if (brandingData.selectedColor) {
      document.documentElement.style.setProperty('--selected-color', brandingData.selectedColor);
      console.log('SupabaseThemeEditor: Set --selected-color to', brandingData.selectedColor);
    }
    // Update all opacity-based colors
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    const primaryColor = brandingData.primaryColor || '#ff5a00';
    
    // Set all opacity-based CSS variables
    document.documentElement.style.setProperty('--accent-light', hexToRgba(primaryColor, 0.08));
    document.documentElement.style.setProperty('--accent-medium', hexToRgba(primaryColor, 0.1));
    document.documentElement.style.setProperty('--accent-dark', hexToRgba(primaryColor, 0.15));
    document.documentElement.style.setProperty('--accent-darker', hexToRgba(primaryColor, 0.25));
    document.documentElement.style.setProperty('--accent-darkest', hexToRgba(primaryColor, 0.3));
    document.documentElement.style.setProperty('--brand-light-opacity', hexToRgba(primaryColor, 0.06));
    document.documentElement.style.setProperty('--brand-medium-opacity', hexToRgba(primaryColor, 0.55));
    document.documentElement.style.setProperty('--brand-strong-opacity', hexToRgba(primaryColor, 0.7));
    
    if (brandingData.nodeStrokeColor) {
      document.documentElement.style.setProperty('--node-stroke-color', hexToRgba(brandingData.nodeStrokeColor, 0.3));
      document.documentElement.style.setProperty('--node-stroke-hover', hexToRgba(brandingData.nodeStrokeColor, 0.08));
      document.documentElement.style.setProperty('--node-stroke-selected', hexToRgba(brandingData.nodeStrokeColor, 0.12));
    }

    // Apply font family
    const fontFamily = this.getFontFamily(brandingData.fontFamily);
    document.documentElement.style.setProperty('--font-family', fontFamily);
    document.body.style.fontFamily = fontFamily;

    // Apply font size
    document.documentElement.style.setProperty('--base-font-size', `${brandingData.fontSize}px`);
    document.body.style.fontSize = `${brandingData.fontSize}px`;

    // Apply logo (only to main app header, not landing page)
    console.log('SupabaseThemeEditor: Applying logo - brandingData.logo:', brandingData.logo, 'mainApp:', !!mainApp);
    if (brandingData.logo && mainApp) {
      const orgLogo = document.getElementById('orgLogo');
      console.log('SupabaseThemeEditor: Found orgLogo element:', !!orgLogo);
      if (orgLogo) {
        orgLogo.src = brandingData.logo;
        orgLogo.style.display = 'block';
        console.log('SupabaseThemeEditor: Logo applied successfully');
      }
    } else if (mainApp) {
      // Hide logo if no branding data
      const orgLogo = document.getElementById('orgLogo');
      console.log('SupabaseThemeEditor: Hiding logo - no branding data');
      if (orgLogo) {
        orgLogo.style.display = 'none';
      }
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
  
  // Add debug method to check logo status
  window.debugLogo = async () => {
    const currentOrgId = localStorage.getItem('current_organization_id');
    console.log('Debug Logo - Current Org ID:', currentOrgId);
    
    if (currentOrgId) {
      try {
        const orgData = await window.orgDb.getOrganization(currentOrgId);
        console.log('Debug Logo - Org Data:', orgData);
        console.log('Debug Logo - Branding:', orgData.branding);
        console.log('Debug Logo - Logo:', orgData.branding?.logo);
        
        const orgLogo = document.getElementById('orgLogo');
        console.log('Debug Logo - Logo Element:', orgLogo);
        console.log('Debug Logo - Logo src:', orgLogo?.src);
        console.log('Debug Logo - Logo display:', orgLogo?.style.display);
      } catch (error) {
        console.error('Debug Logo - Error:', error);
      }
    }
  };
  
  // Add test method to manually set a logo
  window.testLogo = () => {
    const orgLogo = document.getElementById('orgLogo');
    if (orgLogo) {
      // Create a simple test logo (orange square with "T" in it)
      const testLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZmY1YTAwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlQ8L3RleHQ+Cjwvc3ZnPg==';
      orgLogo.src = testLogo;
      orgLogo.style.display = 'block';
      console.log('Test logo applied successfully');
    } else {
      console.error('Logo element not found');
    }
  };
  
  // Add method to set a logo for the current organization
  window.setOrgLogo = async (logoDataUrl) => {
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (!currentOrgId) {
      console.error('No current organization ID found');
      return;
    }
    
    try {
      // Get current organization data
      const orgData = await window.orgDb.getOrganization(currentOrgId);
      if (!orgData) {
        console.error('Organization not found');
        return;
      }
      
      // Update branding with new logo
      const updatedBranding = {
        ...orgData.branding,
        logo: logoDataUrl
      };
      
      // Save to Supabase
      await window.orgDb.updateOrganization(currentOrgId, {
        branding: updatedBranding
      });
      
      // Apply immediately
      const orgLogo = document.getElementById('orgLogo');
      if (orgLogo) {
        orgLogo.src = logoDataUrl;
        orgLogo.style.display = 'block';
      }
      
      console.log('Logo saved and applied successfully');
    } catch (error) {
      console.error('Error setting logo:', error);
    }
  };
  
  // Add debug method to check current CSS variables
  window.checkCSSVariables = () => {
    const styles = getComputedStyle(document.documentElement);
    console.log('Current CSS Variables:');
    console.log('--brand-orange:', styles.getPropertyValue('--brand-orange'));
    console.log('--hover-color:', styles.getPropertyValue('--hover-color'));
    console.log('--selected-color:', styles.getPropertyValue('--selected-color'));
    console.log('--accent-background:', styles.getPropertyValue('--accent-background'));
    console.log('--tree-item-background:', styles.getPropertyValue('--tree-item-background'));
    console.log('--button-background:', styles.getPropertyValue('--button-background'));
    console.log('--node-background:', styles.getPropertyValue('--node-background'));
    console.log('--accent-light:', styles.getPropertyValue('--accent-light'));
    console.log('--accent-medium:', styles.getPropertyValue('--accent-medium'));
  };

  // Simple test function to change colors directly
  window.testDirectColorChange = () => {
    console.log('Testing direct color change...');
    
    // Change brand orange to blue
    document.documentElement.style.setProperty('--brand-orange', '#2563eb');
    document.documentElement.style.setProperty('--hover-color', '#2563eb');
    document.documentElement.style.setProperty('--selected-color', '#2563eb');
    
    // Change accent colors to blue variants
    document.documentElement.style.setProperty('--accent-light', 'rgba(37, 99, 235, 0.08)');
    document.documentElement.style.setProperty('--accent-medium', 'rgba(37, 99, 235, 0.1)');
    document.documentElement.style.setProperty('--accent-dark', 'rgba(37, 99, 235, 0.15)');
    document.documentElement.style.setProperty('--accent-darker', 'rgba(37, 99, 235, 0.25)');
    document.documentElement.style.setProperty('--accent-darkest', 'rgba(37, 99, 235, 0.3)');
    
    console.log('Direct color change applied! Check if buttons are now blue.');
  };

  // Add debug method to test theme presets
  window.testThemePreset = (themeName = 'blue') => {
    const themePresets = {
      orange: {
        primaryColor: '#ff5a00',
        secondaryColor: '#e53e3e',
        backgroundColor: '#f8fafc',
        textColor: '#1a202c',
        borderColor: '#e2e8f0',
        mutedColor: '#718096',
        nodeBackgroundColor: '#ffffff',
        buttonBackgroundColor: '#ffffff',
        accentBackgroundColor: '#ffe6d5',
        treeItemBackgroundColor: '#fff4ed',
        hoverColor: '#ff5a00',
        selectedColor: '#ff5a00',
        nodeStrokeColor: '#ff5a00'
      },
      blue: {
        primaryColor: '#2563eb',
        secondaryColor: '#1d4ed8',
        backgroundColor: '#f8fafc',
        textColor: '#1a202c',
        borderColor: '#e2e8f0',
        mutedColor: '#718096',
        nodeBackgroundColor: '#ffffff',
        buttonBackgroundColor: '#ffffff',
        accentBackgroundColor: '#dbeafe',
        treeItemBackgroundColor: '#eff6ff',
        hoverColor: '#2563eb',
        selectedColor: '#2563eb',
        nodeStrokeColor: '#2563eb'
      }
    };
    
    const theme = themePresets[themeName];
    if (theme) {
      // Apply theme directly to CSS variables
      Object.keys(theme).forEach(key => {
        const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        document.documentElement.style.setProperty(cssVarName, theme[key]);
        console.log(`Set ${cssVarName} = ${theme[key]}`);
      });
      
      // Update brand colors
      document.documentElement.style.setProperty('--brand-orange', theme.primaryColor);
      document.documentElement.style.setProperty('--brand-red', theme.secondaryColor);
      
      // Update all opacity-based colors
      const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      
      document.documentElement.style.setProperty('--accent-light', hexToRgba(theme.primaryColor, 0.08));
      document.documentElement.style.setProperty('--accent-medium', hexToRgba(theme.primaryColor, 0.1));
      document.documentElement.style.setProperty('--accent-dark', hexToRgba(theme.primaryColor, 0.15));
      document.documentElement.style.setProperty('--accent-darker', hexToRgba(theme.primaryColor, 0.25));
      document.documentElement.style.setProperty('--accent-darkest', hexToRgba(theme.primaryColor, 0.3));
      document.documentElement.style.setProperty('--brand-light-opacity', hexToRgba(theme.primaryColor, 0.06));
      document.documentElement.style.setProperty('--brand-medium-opacity', hexToRgba(theme.primaryColor, 0.55));
      document.documentElement.style.setProperty('--brand-strong-opacity', hexToRgba(theme.primaryColor, 0.7));
      
      console.log(`Applied ${themeName} theme successfully!`);
    } else {
      console.error(`Theme ${themeName} not found. Available:`, Object.keys(themePresets));
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

// Make SupabaseThemeEditor globally available
window.SupabaseThemeEditor = SupabaseThemeEditor;
