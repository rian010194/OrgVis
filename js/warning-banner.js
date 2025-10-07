// Warning Banner Management
class WarningBanner {
  constructor() {
    this.banner = document.getElementById('warningBanner');
    this.message = document.getElementById('warningMessage');
    this.closeBtn = document.getElementById('warningClose');
    this.isVisible = false;
    
    this.init();
  }
  
  init() {
    if (!this.banner || !this.closeBtn) {
      console.warn('Warning banner elements not found');
      return;
    }
    
    // Close button functionality
    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });
    
    // Auto-hide after 10 seconds (optional)
    // setTimeout(() => {
    //   this.hide();
    // }, 10000);
    
    // Show banner by default for known issues
    this.showKnownIssues();
  }
  
  show(message, type = 'warning', showLink = true) {
    if (!this.banner || !this.message) return;
    
    if (showLink) {
      // Create message with link to known issues
      this.message.innerHTML = message + ' <a href="known-issues.html" target="_blank" style="color: white; text-decoration: underline; font-weight: 600;">View all known issues</a>';
    } else {
      this.message.textContent = message;
    }
    
    this.banner.classList.remove('hidden');
    this.isVisible = true;
    
    // Adjust body padding
    document.body.style.paddingTop = '3rem';
    
    console.log('Warning banner shown:', message);
  }
  
  hide() {
    if (!this.banner) return;
    
    this.banner.classList.add('hidden');
    this.isVisible = false;
    
    // Remove body padding
    document.body.style.paddingTop = '';
    
    console.log('Warning banner hidden');
  }
  
  showKnownIssues() {
    const issues = [
      // 'Theme saving may cause organization switching. Working on a fix.', // FIXED!
      'Some admin panel functions may be temporarily unavailable.',
      'Map focus may change unexpectedly when switching admin panels.'
    ];
    
    // Don't show any warnings by default now
    // this.show(issues[0]);
  }
  
  updateMessage(message) {
    if (this.message) {
      this.message.textContent = message;
    }
  }
  
  // Method to show specific warnings
  showThemeIssue() {
    // This issue has been fixed!
    // this.show('Theme saving may cause organization switching. Working on a fix.');
  }
  
  showAdminPanelIssue() {
    this.show('Some admin panel functions may be temporarily unavailable.');
  }
  
  showMapFocusIssue() {
    this.show('Map focus may change unexpectedly when switching admin panels.');
  }
  
  showNoLink(message) {
    this.show(message, 'warning', false);
  }
}

// Initialize warning banner when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.warningBanner = new WarningBanner();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WarningBanner;
}
