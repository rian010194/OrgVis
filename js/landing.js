// Landing Page JavaScript
const LandingPage = (() => {
  let currentState = 'landing'; // 'landing', 'creating', 'app'
  
  const init = () => {
    // Initialize with JumpYard demo organization if none exists
    initializeJumpYardDemo();
    
    // Check if there are existing organizations
    const orgList = getOrganizationsList();
    if (orgList.length > 0) {
      showLoadExistingOption();
    }
    
    // Check if there's a current organization and load its branding
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (currentOrgId) {
      loadOrganizationBranding(currentOrgId);
    }
    
    bindEvents();
  };
  
  const initializeJumpYardDemo = async () => {
    const jumpyardOrgId = 'demo_org';
    
    // Always create/update demo organization
    const jumpyardData = {
      name: 'Demo',
      description: 'Demo organization with sample data and structure',
      type: 'company',
      password: null, // No password required
      createdAt: new Date().toISOString(),
      id: jumpyardOrgId
    };
    
    // Save Demo organization
    localStorage.setItem(`org_${jumpyardOrgId}`, JSON.stringify(jumpyardData));
    
    // Create demo organization structure with some sample data
    const demoStructure = createJumpYardDemoStructure();
    localStorage.setItem(`org_structure_${jumpyardOrgId}`, JSON.stringify(demoStructure));
    
    // Add to organizations list (will update if exists)
    saveOrganizationToList(jumpyardOrgId, 'Demo');
    
    // Set Demo branding
    const demoBranding = {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'system',
      fontSize: '16',
      logo: null
    };
    localStorage.setItem(`org_branding_${jumpyardOrgId}`, JSON.stringify(demoBranding));
  };
  
  const createJumpYardDemoStructure = () => {
    return {
      nodes: [
        {
          id: 'demo_root',
          name: 'Demo',
          type: 'Unit',
          parent: null,
          role: 'Demo organization showcasing organizational structure and management',
          responsibilities: [
            'Strategic leadership and vision',
            'Digital transformation initiatives',
            'Organizational excellence',
            'Innovation and growth'
          ],
          outcomes: [
            'Market leadership',
            'Digital transformation success',
            'Organizational efficiency',
            'Innovation pipeline'
          ],
          supportOffice: null
        },
        {
          id: 'jumpyard_tech',
          name: 'Technology Division',
          type: 'Department',
          parent: 'jumpyard_root',
          role: 'Leading technology innovation and digital solutions',
          responsibilities: [
            'Software development',
            'Technology infrastructure',
            'Digital product development',
            'Technical support'
          ],
          outcomes: [
            'Innovative digital products',
            'Robust technology platform',
            'High-quality software solutions',
            'Excellent technical support'
          ],
          supportOffice: null
        },
        {
          id: 'jumpyard_ops',
          name: 'Operations',
          type: 'Department',
          parent: 'jumpyard_root',
          role: 'Ensuring smooth business operations and customer satisfaction',
          responsibilities: [
            'Business operations management',
            'Customer service excellence',
            'Process optimization',
            'Quality assurance'
          ],
          outcomes: [
            'Efficient business processes',
            'High customer satisfaction',
            'Operational excellence',
            'Quality standards compliance'
          ],
          supportOffice: null
        }
      ],
      relations: [
        {
          from: 'jumpyard_tech',
          to: 'jumpyard_ops',
          desc: 'Provides technical support and digital solutions'
        }
      ],
      metrics: {
        'jumpyard_root': [
          {
            name: 'Revenue',
            type: 'line',
            unit: 'SEK',
            values: [
              { label: 'Q1 2024', value: 2500000 },
              { label: 'Q2 2024', value: 2800000 },
              { label: 'Q3 2024', value: 3200000 },
              { label: 'Q4 2024', value: 3500000 }
            ]
          },
          {
            name: 'Employee Satisfaction',
            type: 'pie',
            unit: '%',
            values: [
              { label: 'Very Satisfied', value: 65 },
              { label: 'Satisfied', value: 25 },
              { label: 'Neutral', value: 8 },
              { label: 'Dissatisfied', value: 2 }
            ]
          }
        ]
      }
    };
  };
  
  const bindEvents = () => {
    // Create organization button
    const createOrgBtn = document.getElementById('createOrgBtn');
    const startFreshBtn = document.getElementById('startFreshBtn');
    const loadExistingBtn = document.getElementById('loadExistingBtn');
    
    if (createOrgBtn) {
      createOrgBtn.addEventListener('click', showCreateModal);
    }
    
    if (startFreshBtn) {
      startFreshBtn.addEventListener('click', showCreateModal);
    }
    
    if (loadExistingBtn) {
      loadExistingBtn.addEventListener('click', loadExistingOrganization);
    }
    
    const loadJumpYardBtn = document.getElementById('loadJumpYardBtn');
    if (loadJumpYardBtn) {
      loadJumpYardBtn.addEventListener('click', loadJumpYardDemo);
    }
    
    // Create organization modal events
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    const createOrgForm = document.getElementById('createOrgForm');
    
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', hideCreateModal);
    }
    
    if (cancelCreateBtn) {
      cancelCreateBtn.addEventListener('click', hideCreateModal);
    }
    
    if (createOrgForm) {
      createOrgForm.addEventListener('submit', handleCreateOrganization);
    }
    
    // Login modal events
    const closeLoginBtn = document.getElementById('closeLoginBtn');
    const cancelLoginBtn = document.getElementById('cancelLoginBtn');
    const loginForm = document.getElementById('loginForm');
    
    if (closeLoginBtn) {
      closeLoginBtn.addEventListener('click', hideLoginModal);
    }
    
    if (cancelLoginBtn) {
      cancelLoginBtn.addEventListener('click', hideLoginModal);
    }
    
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    
    // Customization modal events
    const closeCustomizationBtn = document.getElementById('closeCustomizationBtn');
    const skipCustomizationBtn = document.getElementById('skipCustomizationBtn');
    const customizationForm = document.getElementById('customizationForm');
    const uploadLogoBtn = document.getElementById('uploadLogoBtn');
    const orgLogoInput = document.getElementById('orgLogo');
    
    if (closeCustomizationBtn) {
      closeCustomizationBtn.addEventListener('click', hideCustomizationModal);
    }
    
    if (skipCustomizationBtn) {
      skipCustomizationBtn.addEventListener('click', skipCustomization);
    }
    
    if (customizationForm) {
      customizationForm.addEventListener('submit', handleCustomization);
    }
    
    if (uploadLogoBtn && orgLogoInput) {
      uploadLogoBtn.addEventListener('click', () => orgLogoInput.click());
    }
    
    if (orgLogoInput) {
      orgLogoInput.addEventListener('change', handleLogoUpload);
    }
    
    // Color input synchronization
    const primaryColor = document.getElementById('primaryColor');
    const primaryColorText = document.getElementById('primaryColorText');
    const secondaryColor = document.getElementById('secondaryColor');
    const secondaryColorText = document.getElementById('secondaryColorText');
    
    if (primaryColor && primaryColorText) {
      primaryColor.addEventListener('input', (e) => {
        primaryColorText.value = e.target.value;
      });
      primaryColorText.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          primaryColor.value = e.target.value;
        }
      });
    }
    
    if (secondaryColor && secondaryColorText) {
      secondaryColor.addEventListener('input', (e) => {
        secondaryColorText.value = e.target.value;
      });
      secondaryColorText.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          secondaryColor.value = e.target.value;
        }
      });
    }
    
    // Close modals when clicking outside
    const createModalOverlay = document.getElementById('createOrgModal');
    const loginModalOverlay = document.getElementById('loginModal');
    const customizationModalOverlay = document.getElementById('customizationModal');
    
    if (createModalOverlay) {
      createModalOverlay.addEventListener('click', (e) => {
        if (e.target === createModalOverlay) {
          hideCreateModal();
        }
      });
    }
    
    if (loginModalOverlay) {
      loginModalOverlay.addEventListener('click', (e) => {
        if (e.target === loginModalOverlay) {
          hideLoginModal();
        }
      });
    }
    
    if (customizationModalOverlay) {
      customizationModalOverlay.addEventListener('click', (e) => {
        if (e.target === customizationModalOverlay) {
          hideCustomizationModal();
        }
      });
    }
  };
  
  const showCreateModal = () => {
    const modal = document.getElementById('createOrgModal');
    if (modal) {
      modal.classList.remove('hidden');
      // Focus on first input
      const firstInput = modal.querySelector('input');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  };
  
  const hideCreateModal = () => {
    const modal = document.getElementById('createOrgModal');
    if (modal) {
      modal.classList.add('hidden');
      // Reset form
      const form = document.getElementById('createOrgForm');
      if (form) {
        form.reset();
      }
    }
  };
  
  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const orgId = generateOrgId();
    const password = formData.get('orgPassword');
    
    const orgData = {
      name: formData.get('orgName'),
      description: formData.get('orgDescription'),
      type: formData.get('orgType'),
      password: password ? await hashPassword(password) : null,
      createdAt: new Date().toISOString(),
      id: orgId
    };
    
    try {
      // Save organization data with unique key
      localStorage.setItem(`org_${orgId}`, JSON.stringify(orgData));
      
      // Create initial organization structure
      const initialStructure = createInitialStructure(orgData);
      localStorage.setItem(`org_structure_${orgId}`, JSON.stringify(initialStructure));
      
      // Save organization list
      saveOrganizationToList(orgId, orgData.name);
      
      // Set current organization
      localStorage.setItem('current_organization_id', orgId);
      
      // Show success message
      showSuccessMessage('Organization created successfully!');
      
      // Hide create modal and show customization modal
      hideCreateModal();
      showCustomizationModal();
      
    } catch (error) {
      console.error('Error creating organization:', error);
      showErrorMessage('Failed to create organization. Please try again.');
    }
  };
  
  const createInitialStructure = (orgData) => {
    // Create a completely empty organization structure
    return {
      nodes: [],
      relations: [],
      metrics: {}
    };
  };
  
  const loadExistingOrganization = () => {
    const orgList = getOrganizationsList();
    if (orgList.length === 0) {
      showErrorMessage('No existing organizations found.');
      return;
    }
    
    if (orgList.length === 1) {
      // If only one organization, try to load it directly
      const orgId = orgList[0].id;
      const orgData = JSON.parse(localStorage.getItem(`org_${orgId}`) || '{}');
      
      if (orgData.password) {
        // Organization has password, show login modal
        showLoginModal(orgId);
      } else {
        // No password, load directly
        localStorage.setItem('current_organization_id', orgId);
        loadOrganizationBranding(orgId);
        showMainApp();
      }
    } else {
      // Multiple organizations, show login modal
      showLoginModal();
    }
  };
  
  const loadJumpYardDemo = () => {
    const jumpyardOrgId = 'demo_org';
    const orgData = JSON.parse(localStorage.getItem(`org_${jumpyardOrgId}`) || '{}');
    
    if (orgData.id) {
      // Demo exists, check if password is required
      if (orgData.password) {
        showLoginModal(jumpyardOrgId);
      } else {
        // No password required, login directly
        localStorage.setItem('current_organization_id', jumpyardOrgId);
        loadOrganizationBranding(jumpyardOrgId);
        showMainApp();
      }
    } else {
      // Demo not found, try to create it
      console.log('Demo organization not found, creating it...');
      initializeJumpYardDemo().then(() => {
        // Try again after creation
        const newOrgData = JSON.parse(localStorage.getItem(`org_${jumpyardOrgId}`) || '{}');
        if (newOrgData.id) {
          localStorage.setItem('current_organization_id', jumpyardOrgId);
          loadOrganizationBranding(jumpyardOrgId);
          showMainApp();
        } else {
          showErrorMessage('Failed to create demo organization. Please refresh the page.');
        }
      }).catch(error => {
        console.error('Error creating demo organization:', error);
        showErrorMessage('Failed to create demo organization. Please refresh the page.');
      });
    }
  };
  
  const showLoginModal = (orgId = null) => {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // If specific org ID, pre-fill the name
      if (orgId) {
        const orgData = JSON.parse(localStorage.getItem(`org_${orgId}`) || '{}');
        const nameInput = document.getElementById('loginOrgName');
        if (nameInput) {
          nameInput.value = orgData.name;
          nameInput.readOnly = true;
        }
      }
    }
  };
  
  const hideLoginModal = () => {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.classList.add('hidden');
      // Reset form
      const form = document.getElementById('loginForm');
      if (form) {
        form.reset();
        const nameInput = document.getElementById('loginOrgName');
        if (nameInput) {
          nameInput.readOnly = false;
        }
      }
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const orgName = formData.get('orgName');
    const password = formData.get('password');
    
    // Find organization by name
    const orgList = getOrganizationsList();
    const org = orgList.find(o => o.name.toLowerCase() === orgName.toLowerCase());
    
    if (!org) {
      showErrorMessage('Organization not found.');
      return;
    }
    
    const orgData = JSON.parse(localStorage.getItem(`org_${org.id}`) || '{}');
    
    // Check password if organization has one
    if (orgData.password) {
      const hashedPassword = await hashPassword(password);
      if (hashedPassword !== orgData.password) {
        showErrorMessage('Incorrect password.');
        return;
      }
    }
    
    // Try to use user management system if available
    if (typeof userManager !== 'undefined') {
      try {
        // For now, create a demo admin user for the organization
        const adminEmail = `admin@${orgName.toLowerCase().replace(/\s+/g, '')}.com`;
        const result = await userManager.login(adminEmail, password);
        
        if (result.success) {
          // Login successful with user management
          localStorage.setItem('current_organization_id', org.id);
          loadOrganizationBranding(org.id);
          hideLoginModal();
          showMainApp();
          return;
        }
      } catch (error) {
        console.log('User management not available, falling back to organization login');
      }
    }
    
    // Fallback to organization-level login
    localStorage.setItem('current_organization_id', org.id);
    loadOrganizationBranding(org.id);
    hideLoginModal();
    showMainApp();
  };
  
  const showMainApp = async () => {
    const landingPage = document.getElementById('landingPage');
    const mainApp = document.getElementById('mainApp');
    
    if (landingPage) {
      landingPage.classList.add('hidden');
    }
    
    if (mainApp) {
      mainApp.classList.remove('hidden');
    }
    
    // Initialize the main app
    currentState = 'app';
    
    // Small delay to ensure DOM is ready, then trigger main app initialization
    setTimeout(async () => {
      try {
        const statusElement = document.getElementById("appStatus");
        if (statusElement) {
          statusElement.textContent = "Loading organization data...";
          statusElement.classList.remove("error");
        }

        // Load organization data
        if (typeof OrgStore !== 'undefined' && OrgStore.load) {
          await OrgStore.load();
        }
        
        // Initialize UI components
        if (typeof OrgUI !== 'undefined' && OrgUI.init) {
          OrgUI.init();
        }
        
        // Initialize map view if D3.js is available
        if (typeof d3 !== "undefined" && typeof OrgMap !== 'undefined' && OrgMap.init) {
          OrgMap.init();
        }
        
        // Initialize app view
        if (typeof AppView !== 'undefined' && AppView.init) {
          AppView.init();
        }
        
        if (statusElement) {
          statusElement.textContent = "";
        }
      } catch (error) {
        console.error("Could not initialize application", error);
        const statusElement = document.getElementById("appStatus");
        if (statusElement) {
          statusElement.textContent = "Could not load data. Please try again or contact administrator.";
          statusElement.classList.add("error");
        }
      }
    }, 100);
  };
  
  const showLoadExistingOption = () => {
    const orgList = getOrganizationsList();
    const loadExistingBtn = document.getElementById('loadExistingBtn');
    if (loadExistingBtn && orgList.length > 0) {
      loadExistingBtn.style.display = 'block';
    }
  };
  
  const showCustomizationModal = () => {
    const modal = document.getElementById('customizationModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  };
  
  const hideCustomizationModal = () => {
    const modal = document.getElementById('customizationModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };
  
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoPreview = document.getElementById('logoPreview');
        if (logoPreview) {
          logoPreview.innerHTML = `<img src="${e.target.result}" alt="Organization Logo">`;
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCustomization = (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const customizationData = {
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
        customizationData.logo = e.target.result;
        saveCustomizationAndContinue(customizationData);
      };
      reader.readAsDataURL(logoFile);
    } else {
      saveCustomizationAndContinue(customizationData);
    }
  };
  
  const saveCustomizationAndContinue = (customizationData) => {
    try {
      const currentOrgId = localStorage.getItem('current_organization_id');
      if (!currentOrgId) {
        showErrorMessage('No organization selected.');
        return;
      }
      
      // Save customization data for this specific organization
      localStorage.setItem(`org_branding_${currentOrgId}`, JSON.stringify(customizationData));
      
      // Apply branding to the page
      applyBranding(customizationData);
      
      // Hide modal and show app
      hideCustomizationModal();
      showMainApp();
      
    } catch (error) {
      console.error('Error saving customization:', error);
      showErrorMessage('Failed to save customization. Please try again.');
    }
  };
  
  const skipCustomization = () => {
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (!currentOrgId) {
      showErrorMessage('No organization selected.');
      return;
    }
    
    // Use default branding
    const defaultBranding = {
      primaryColor: '#ff5a00',
      secondaryColor: '#e53e3e',
      fontFamily: 'system',
      fontSize: '16',
      logo: null
    };
    
    localStorage.setItem(`org_branding_${currentOrgId}`, JSON.stringify(defaultBranding));
    hideCustomizationModal();
    showMainApp();
  };
  
  const loadOrganizationBranding = (orgId) => {
    const brandingData = localStorage.getItem(`org_branding_${orgId}`);
    if (brandingData) {
      try {
        const branding = JSON.parse(brandingData);
        applyBranding(branding);
      } catch (error) {
        console.error('Error loading branding:', error);
      }
    }
  };
  
  const applyBranding = (brandingData) => {
    // Apply colors to CSS custom properties
    if (brandingData.primaryColor) {
      document.documentElement.style.setProperty('--brand-orange', brandingData.primaryColor);
      // Also update the gradient
      const gradient = `linear-gradient(135deg, ${brandingData.primaryColor} 0%, ${brandingData.secondaryColor || '#e53e3e'} 100%)`;
      document.documentElement.style.setProperty('--brand-gradient', gradient);
    }
    if (brandingData.secondaryColor) {
      document.documentElement.style.setProperty('--brand-red', brandingData.secondaryColor);
      // Update gradient if primary color is also set
      if (brandingData.primaryColor) {
        const gradient = `linear-gradient(135deg, ${brandingData.primaryColor} 0%, ${brandingData.secondaryColor} 100%)`;
        document.documentElement.style.setProperty('--brand-gradient', gradient);
      }
    }
    
    // Apply font family globally using CSS custom properties
    if (brandingData.fontFamily && brandingData.fontFamily !== 'system') {
      const fontFamilies = {
        'inter': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'roboto': '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'open-sans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'lato': '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'montserrat': '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'poppins': '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      };
      
      if (fontFamilies[brandingData.fontFamily]) {
        const fontFamily = fontFamilies[brandingData.fontFamily];
        document.documentElement.style.setProperty('--font-family', fontFamily);
        document.body.style.fontFamily = fontFamily;
      }
    } else if (brandingData.fontFamily === 'system') {
      // Reset to system font
      document.documentElement.style.removeProperty('--font-family');
      document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    }
    
    // Apply font size globally using CSS custom properties
    if (brandingData.fontSize) {
      const fontSize = brandingData.fontSize + 'px';
      document.documentElement.style.setProperty('--base-font-size', fontSize);
      document.body.style.fontSize = fontSize;
    } else {
      // If no font size specified, ensure we have a default
      document.documentElement.style.setProperty('--base-font-size', '16px');
      document.body.style.fontSize = '16px';
    }
    
    // Apply logo to header (both landing page and main app)
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
    
    // Update organization name in header if available
    const currentOrgId = localStorage.getItem('current_organization_id');
    if (currentOrgId) {
      const orgData = JSON.parse(localStorage.getItem(`org_${currentOrgId}`) || '{}');
      if (orgData.name) {
        const headers = document.querySelectorAll('header');
        headers.forEach(header => {
          const titleElement = header.querySelector('h1, .landing-title');
          if (titleElement && !titleElement.classList.contains('landing-title')) {
            titleElement.textContent = orgData.name;
          }
        });
      }
    }
  };
  
  const hashPassword = async (password) => {
    // Simple hash function (in production, use a proper hashing library)
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  const saveOrganizationToList = (orgId, orgName) => {
    const orgList = JSON.parse(localStorage.getItem('organizations_list') || '[]');
    
    // Remove existing entry if it exists
    const existingIndex = orgList.findIndex(org => org.id === orgId);
    if (existingIndex !== -1) {
      orgList[existingIndex] = { id: orgId, name: orgName };
    } else {
      orgList.push({ id: orgId, name: orgName });
    }
    
    localStorage.setItem('organizations_list', JSON.stringify(orgList));
  };
  
  const getOrganizationsList = () => {
    return JSON.parse(localStorage.getItem('organizations_list') || '[]');
  };
  
  const generateOrgId = () => {
    return 'org_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };
  
  const showSuccessMessage = (message) => {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2e7d32;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      font-weight: 600;
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  };
  
  const showErrorMessage = (message) => {
    // Create a temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #c62828;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      font-weight: 600;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 4 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 4000);
  };
  
  const handleLogout = async () => {
    // Try to use user management system if available
    if (typeof userManager !== 'undefined') {
      try {
        await userManager.logout();
      } catch (error) {
        console.log('User management logout failed, continuing with organization logout');
      }
    }
    
    // Clear current organization
    localStorage.removeItem('current_organization_id');
    
    // Reset all branding to default
    document.documentElement.style.removeProperty('--brand-orange');
    document.documentElement.style.removeProperty('--brand-red');
    document.documentElement.style.removeProperty('--brand-gradient');
    document.documentElement.style.removeProperty('--font-family');
    document.documentElement.style.removeProperty('--base-font-size');
    
    // Reset body font to default values (not empty strings)
    document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    document.body.style.fontSize = '16px'; // Set explicit default font size
    
    // Reset any remaining inline font styles (should be minimal now)
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, input, select, textarea, label, a');
    textElements.forEach(el => {
      el.style.fontFamily = '';
      el.style.fontSize = '';
    });
    
    // Remove any organization logos from headers
    const existingLogos = document.querySelectorAll('.organization-logo');
    existingLogos.forEach(logo => logo.remove());
    
    // Reset header titles to default
    const headers = document.querySelectorAll('header');
    headers.forEach(header => {
      const titleElement = header.querySelector('h1');
      if (titleElement && !titleElement.classList.contains('landing-title')) {
        titleElement.textContent = 'Organization Chart';
      }
    });
    
    // Show landing page and hide main app
    const landingPage = document.getElementById('landingPage');
    const mainApp = document.getElementById('mainApp');
    
    if (landingPage) {
      landingPage.classList.remove('hidden');
    }
    
    if (mainApp) {
      mainApp.classList.add('hidden');
    }
    
    // Reset state
    currentState = 'landing';
    
    // Show success message
    showSuccessMessage('Logged out successfully!');
    
    // Remove the forced page reload - it's causing the text size issue
    // The logout should work without needing a page refresh
  };
  
  // Public API
  return {
    init,
    showMainApp,
    hideCreateModal,
    showCreateModal,
    handleLogout
  };
})();

// Initialize landing page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  LandingPage.init();
});

// Global logout button handler (works even if main app hasn't initialized yet)
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'logoutBtn') {
    e.preventDefault();
    if (typeof LandingPage !== 'undefined' && LandingPage.handleLogout) {
      LandingPage.handleLogout();
    }
  }
});
