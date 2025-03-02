document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sourcePathInput = document.getElementById('source-path');
  const targetPathInput = document.getElementById('target-path');
  const sortPatternSelect = document.getElementById('sort-pattern');
  const copyModeCheckbox = document.getElementById('copy-mode');
  const sortBtn = document.getElementById('sort-btn');
  const scanBtn = document.getElementById('scan-btn');
  const analyzeBtn = document.getElementById('analyze-btn');
  const undoBtn = document.getElementById('undo-btn');
  const fab = document.getElementById('fab');
  const statusCard = document.getElementById('status-card');
  const statusMessage = document.getElementById('status-message');
  const progressBar = document.getElementById('progress-bar');
  const resultsCard = document.getElementById('results-card');
  const resultsContainer = document.getElementById('results-container');
  const closeResultsBtn = document.getElementById('close-results');
  const themeToggle = document.getElementById('theme-toggle');
  const snackbar = document.getElementById('snackbar');
  const snackbarText = document.getElementById('snackbar-text');
  const snackbarAction = document.getElementById('snackbar-action');
  const settingsBtn = document.getElementById('settings-btn');

  // Settings-related elements (if present)
  const saveSettingsBtn = document.getElementById('save-settings');
  const resetSettingsBtn = document.getElementById('reset-settings');

  // State
  let darkMode = localStorage.getItem('darkMode') === 'true';
  let currentSettings = null;

  // Initialize app
  function init() {
    // Apply theme
    updateTheme();
    
    // Load settings and configuration
    loadConfig();
    
    // Attach event listeners
    setupEventListeners();
    
    // Add dynamic styles
    addDynamicStyles();
  }

  // Show status in the status card
  function showStatus(message, type = 'normal') {
    statusMessage.textContent = message;
    statusCard.style.display = 'block';
    
    if (type === 'indeterminate') {
      progressBar.classList.add('indeterminate');
      progressBar.style.width = '30%';
    } else if (type === 'error') {
      progressBar.classList.remove('indeterminate');
      progressBar.style.width = '100%';
      progressBar.style.backgroundColor = 'var(--error-color)';
    } else if (type === 'success') {
      progressBar.classList.remove('indeterminate');
      progressBar.style.width = '100%';
      progressBar.style.backgroundColor = 'var(--success-color)';
      
      // Auto hide after success
      setTimeout(() => {
        statusCard.style.display = 'none';
        progressBar.style.backgroundColor = 'var(--primary-color)';
      }, 2000);
    } else {
      progressBar.classList.remove('indeterminate');
      progressBar.style.width = '0';
    }
  }

  // Show results in the results card
  function showResults(html) {
    resultsContainer.innerHTML = html;
    resultsCard.style.display = 'block';
    
    // Apply styles to the file list for better readability
    const fileList = document.querySelector('.file-list');
    if (fileList) {
      const listItems = fileList.querySelectorAll('li');
      listItems.forEach(item => {
        item.style.padding = '4px 0';
        item.style.wordBreak = 'break-all';
      });
    }
    
    // Add styling to the stats grid if it exists
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
      statsGrid.style.display = 'grid';
      statsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
      statsGrid.style.gap = '16px';
      statsGrid.style.margin = '16px 0';
      
      const statCards = statsGrid.querySelectorAll('.stat-card');
      statCards.forEach(card => {
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.padding = '16px';
        card.style.backgroundColor = 'rgba(98, 0, 238, 0.08)';
        card.style.borderRadius = '8px';
        card.style.transition = 'transform 200ms ease';
        
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'scale(1.05)';
        });
        
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'scale(1)';
        });
        
        const statValue = card.querySelector('.stat-value');
        if (statValue) {
          statValue.style.fontSize = '1.5rem';
          statValue.style.fontWeight = 'bold';
          statValue.style.color = 'var(--primary-color)';
          statValue.style.margin = '8px 0';
        }
      });
    }
  }

  // Show snackbar notification
  function showSnackbar(message, actionText = 'DISMISS', actionCallback = null) {
    snackbarText.textContent = message;
    
    if (actionText) {
      snackbarAction.textContent = actionText;
      snackbarAction.onclick = actionCallback || dismissSnackbar;
      snackbarAction.style.display = 'block';
    } else {
      snackbarAction.style.display = 'none';
    }
    
    snackbar.classList.add('show');
    
    // Auto dismiss after 5 seconds
    setTimeout(dismissSnackbar, 5000);
  }

  // Dismiss the snackbar
  function dismissSnackbar() {
    snackbar.classList.remove('show');
  }

  // Toggle between light and dark theme
  function toggleTheme() {
    darkMode = !darkMode;
    updateTheme();
    localStorage.setItem('darkMode', darkMode);
  }
  
  // Update theme based on dark mode state
  function updateTheme() {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      themeToggle.querySelector('.material-icons').textContent = 'light_mode';
    } else {
      document.body.classList.remove('dark-theme');
      themeToggle.querySelector('.material-icons').textContent = 'dark_mode';
    }
  }
  
  // Add CSS styles for file list
  function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .file-list {
        background-color: var(--background-color);
        border-radius: 4px;
        padding: 12px;
        margin-top: 12px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .file-list ul {
        list-style-type: none;
        padding-left: 0;
      }
      
      .file-list li {
        padding: 4px 0;
        border-bottom: 1px solid rgba(0,0,0,0.08);
      }
      
      .dark-theme .file-list li {
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      
      h3, h4 {
        margin-top: 0;
        margin-bottom: 12px;
        color: var(--primary-color);
      }
      
      .settings-section {
        margin-bottom: 24px;
      }
      
      .settings-section h3 {
        margin-bottom: 16px;
      }
      
      .patterns-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 8px;
        margin-top: 12px;
      }
      
      .pattern-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: var(--background-color);
        border-radius: 16px;
        padding: 4px 12px;
        margin-bottom: 8px;
      }
      
      .pattern-chip .pattern-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    document.head.appendChild(style);
  }

  // Load configuration and settings
  async function loadConfig() {
    try {
      showStatus('Loading configuration...', 'indeterminate');
      
      const response = await fetch('/api/config');
      const config = await response.json();
      
      console.log('Loaded configuration:', config);
      
      // Store current settings
      currentSettings = config.settings;
      
      // Set input values from settings
      if (config.settings) {
        sourcePathInput.value = config.settings.sourcePath;
        targetPathInput.value = config.settings.targetPath;
        
        // Set copy mode checkbox from settings
        if (copyModeCheckbox) {
          copyModeCheckbox.checked = config.settings.copyByDefault;
        }
        
        // Select the last used pattern if available
        if (config.settings.lastUsedPattern && sortPatternSelect) {
          const option = Array.from(sortPatternSelect.options).find(
            opt => opt.value === config.settings.lastUsedPattern
          );
          
          if (option) {
            sortPatternSelect.value = config.settings.lastUsedPattern;
          }
        }
        
        // Populate custom patterns if present in the UI
        if (config.settings.customPatterns) {
          displayCustomPatterns(config.settings.customPatterns);
        }
      } else {
        // Fallback to paths from config if settings aren't available
        sourcePathInput.value = config.paths.SOURCE;
        targetPathInput.value = config.paths.TARGET;
      }
      
      // Hide loading status
      statusCard.style.display = 'none';
      showSnackbar('Configuration loaded successfully');
    } catch (error) {
      console.error('Error loading configuration:', error);
      showStatus('Error loading configuration', 'error');
      showSnackbar('Error loading configuration', 'RETRY', loadConfig);
    }
  }

  // Display custom patterns in UI (if supported)
  function displayCustomPatterns(customPatterns) {
    // Check if the patterns containers exist in the DOM
    const renamePatterns = document.getElementById('rename-patterns');
    const sortPatterns = document.getElementById('sort-patterns');
    
    if (renamePatterns && customPatterns.rename) {
      renamePatterns.innerHTML = '';
      
      if (customPatterns.rename.length === 0) {
        renamePatterns.innerHTML = '<p>No custom rename patterns</p>';
      } else {
        const patternsGrid = document.createElement('div');
        patternsGrid.className = 'patterns-grid';
        
        customPatterns.rename.forEach(pattern => {
          const chip = document.createElement('div');
          chip.className = 'pattern-chip';
          
          const patternText = document.createElement('span');
          patternText.className = 'pattern-text';
          patternText.textContent = pattern;
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'icon-button';
          deleteBtn.innerHTML = '<span class="material-icons">close</span>';
          deleteBtn.onclick = () => removeCustomPattern('rename', pattern);
          
          chip.appendChild(patternText);
          chip.appendChild(deleteBtn);
          patternsGrid.appendChild(chip);
        });
        
        renamePatterns.appendChild(patternsGrid);
      }
    }
    
    if (sortPatterns && customPatterns.sort) {
      sortPatterns.innerHTML = '';
      
      if (customPatterns.sort.length === 0) {
        sortPatterns.innerHTML = '<p>No custom sort patterns</p>';
      } else {
        const patternsGrid = document.createElement('div');
        patternsGrid.className = 'patterns-grid';
        
        customPatterns.sort.forEach(pattern => {
          const chip = document.createElement('div');
          chip.className = 'pattern-chip';
          
          const patternText = document.createElement('span');
          patternText.className = 'pattern-text';
          patternText.textContent = pattern;
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'icon-button';
          deleteBtn.innerHTML = '<span class="material-icons">close</span>';
          deleteBtn.onclick = () => removeCustomPattern('sort', pattern);
          
          chip.appendChild(patternText);
          chip.appendChild(deleteBtn);
          patternsGrid.appendChild(chip);
        });
        
        sortPatterns.appendChild(patternsGrid);
      }
    }
  }

  // Add a custom pattern
  async function addCustomPattern(type, pattern) {
    try {
      const response = await fetch(`/api/settings/patterns/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pattern })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showSnackbar(`Added custom ${type} pattern`);
        loadConfig(); // Reload settings to display the new pattern
      } else {
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error(`Error adding custom ${type} pattern:`, error);
      showSnackbar(`Error adding pattern: ${error.message}`, 'DISMISS');
    }
  }

  // Remove a custom pattern
  async function removeCustomPattern(type, pattern) {
    try {
      const response = await fetch(`/api/settings/patterns/${type}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pattern })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showSnackbar(`Removed custom ${type} pattern`);
        loadConfig(); // Reload settings to update the UI
      } else {
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error(`Error removing custom ${type} pattern:`, error);
      showSnackbar(`Error removing pattern: ${error.message}`, 'DISMISS');
    }
  }

  // Save current settings
  async function saveSettings() {
    try {
      const settings = {
        sourcePath: sourcePathInput.value,
        targetPath: targetPathInput.value,
        copyByDefault: copyModeCheckbox ? copyModeCheckbox.checked : false
      };
      
      if (sortPatternSelect && sortPatternSelect.value) {
        settings.defaultSortPattern = sortPatternSelect.value;
      }
      
      showStatus('Saving settings...', 'indeterminate');
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      const result = await response.json();
      
      if (result.success) {
        showStatus('Settings saved!', 'success');
        showSnackbar('Settings saved successfully');
        currentSettings = { ...currentSettings, ...settings };
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error saving settings: ${error.message}`, 'DISMISS');
    }
  }

  // Reset settings to defaults
  async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }
    
    try {
      showStatus('Resetting settings...', 'indeterminate');
      
      const response = await fetch('/api/settings/reset', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        showStatus('Settings reset!', 'success');
        showSnackbar('Settings reset to defaults');
        loadConfig(); // Reload to display default settings
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error resetting settings: ${error.message}`, 'DISMISS');
    }
  }

  // Handle sort button click
  async function handleSort() {
    try {
      const pattern = sortPatternSelect.value;
      const sourcePath = sourcePathInput.value;
      const targetPath = targetPathInput.value;
      const copy = copyModeCheckbox.checked;
      
      if (!pattern) {
        showSnackbar('Please select a sort pattern', 'DISMISS');
        return;
      }
      
      if (!sourcePath || !targetPath) {
        showSnackbar('Please provide source and target paths', 'DISMISS');
        return;
      }
      
      showStatus(`Sorting files with pattern: ${pattern}...`, 'indeterminate');
      
      const response = await fetch('/api/sort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pattern, sourcePath, targetPath, copy })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showStatus('Sorting complete!', 'success');
        showSnackbar('Files have been sorted successfully');
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error during sort operation:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error sorting files: ${error.message}`, 'DISMISS');
    }
  }

  // Handle scan button click
  async function handleScan() {
    try {
      const sourcePath = sourcePathInput.value;
      
      if (!sourcePath) {
        showSnackbar('Please provide a source path', 'DISMISS');
        return;
      }
      
      showStatus('Scanning files...', 'indeterminate');
      
      const response = await fetch(`/api/scan?path=${encodeURIComponent(sourcePath)}`);
      const result = await response.json();
      
      if (result.success) {
        const fileCount = result.files.length;
        
        let html = `
          <h3>Scan Results</h3>
          <p>Found ${fileCount} files in ${sourcePath}</p>
        `;
        
        if (fileCount > 0) {
          html += `
            <div class="file-list">
              <ul>
                ${result.files.map(file => `<li>${file}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        showResults(html);
        showStatus('Scan complete!', 'success');
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error during scan operation:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error scanning files: ${error.message}`, 'DISMISS');
    }
  }

  // Handle analyze button click
  async function handleAnalyze() {
    try {
      const sourcePath = sourcePathInput.value;
      
      if (!sourcePath) {
        showSnackbar('Please provide a source path', 'DISMISS');
        return;
      }
      
      showStatus('Analyzing music collection...', 'indeterminate');
      
      const response = await fetch(`/api/metadata?path=${encodeURIComponent(sourcePath)}`);
      const result = await response.json();
      
      if (result.success) {
        const musicFiles = result.musicFiles;
        
        // Count artists, albums, genres
        const artists = new Set();
        const albums = new Set();
        const genres = new Set();
        const years = new Set();
        
        musicFiles.forEach(file => {
          if (file.metadata.artist) artists.add(file.metadata.artist);
          if (file.metadata.album) albums.add(file.metadata.album);
          if (file.metadata.genre) genres.add(file.metadata.genre);
          if (file.metadata.year) years.add(file.metadata.year);
        });
        
        let html = `
          <h3>Analysis Results</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Total Files</span>
              <span class="stat-value">${musicFiles.length}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Artists</span>
              <span class="stat-value">${artists.size}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Albums</span>
              <span class="stat-value">${albums.size}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Genres</span>
              <span class="stat-value">${genres.size}</span>
            </div>
            ${years.size > 0 ? `
              <div class="stat-card">
                <span class="stat-label">Years</span>
                <span class="stat-value">${years.size}</span>
              </div>
            ` : ''}
          </div>
          
          <h4>Music Files</h4>
          <div class="file-list">
            <ul>
              ${musicFiles.map(file => {
                const artist = file.metadata.artist || 'Unknown';
                const title = file.metadata.title || file.filename;
                return `<li>${artist} - ${title}</li>`;
              }).join('')}
            </ul>
          </div>
        `;
        
        showResults(html);
        showStatus('Analysis complete!', 'success');
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error during analyze operation:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error analyzing files: ${error.message}`, 'DISMISS');
    }
  }

  // Handle undo button click
  async function handleUndo() {
    if (!confirm('Are you sure you want to undo the last sort operation? This will move files back to the source directory.')) {
      return;
    }
    
    try {
      const sourcePath = sourcePathInput.value;
      const targetPath = targetPathInput.value;
      
      if (!sourcePath || !targetPath) {
        showSnackbar('Please provide source and target paths', 'DISMISS');
        return;
      }
      
      showStatus('Undoing sort operation...', 'indeterminate');
      
      const response = await fetch('/api/undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sourcePath, targetPath })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showStatus('Undo operation complete!', 'success');
        showSnackbar(`Files have been restored. ${result.details.successCount} files moved, ${result.details.errorCount} errors.`);
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error during undo operation:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error undoing sort: ${error.message}`, 'DISMISS');
    }
  }

  // Show settings modal
  function showSettings() {
    // If a settings modal already exists in the DOM, show it and return
    const existingModal = document.getElementById('settings-modal');
    if (existingModal) {
      existingModal.style.display = 'block';
      return;
    }
    
    // Create settings modal
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'modal';
    
    // Settings content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content card';
    
    // Header
    const header = document.createElement('div');
    header.className = 'card-title';
    header.innerHTML = `
      <h2>Settings</h2>
      <button id="close-settings" class="icon-button">
        <span class="material-icons">close</span>
      </button>
    `;
    
    // Content
    const content = document.createElement('div');
    content.className = 'card-content';
    
    // Paths section
    const pathsSection = document.createElement('div');
    pathsSection.className = 'settings-section';
    pathsSection.innerHTML = `
      <h3>File Paths</h3>
      <div class="form-field">
        <label for="settings-source-path">Source Directory</label>
        <div class="input-container">
          <input type="text" id="settings-source-path" class="text-input" value="${sourcePathInput.value}">
        </div>
      </div>
      <div class="form-field">
        <label for="settings-target-path">Target Directory</label>
        <div class="input-container">
          <input type="text" id="settings-target-path" class="text-input" value="${targetPathInput.value}">
        </div>
      </div>
    `;
    
    // Behavior section
    const behaviorSection = document.createElement('div');
    behaviorSection.className = 'settings-section';
    behaviorSection.innerHTML = `
      <h3>Behavior</h3>
      <div class="form-field">
        <label for="settings-default-pattern">Default Sort Pattern</label>
        <div class="select-container">
          <select id="settings-default-pattern" class="select-input">
            <option value="artist">Artist</option>
            <option value="album-artist">Album Artist</option>
            <option value="album">Album</option>
            <option value="genre">Genre</option>
            <option value="year">Year</option>
          </select>
          <span class="material-icons">arrow_drop_down</span>
        </div>
      </div>
      <div class="form-field">
        <label for="settings-default-rename">Default Rename Pattern</label>
        <div class="input-container">
          <input type="text" id="settings-default-rename" class="text-input" 
            placeholder="{artist} - {title}"
            value="${currentSettings?.defaultRenamePattern || '{artist} - {title}'}">
        </div>
        <small>Available tags: {artist}, {albumArtist}, {album}, {title}, {genre}, {year}, {track}</small>
      </div>
      <div class="form-field">
        <label class="checkbox-container">
          <input type="checkbox" id="settings-copy-mode" ${copyModeCheckbox?.checked ? 'checked' : ''}>
          <span class="checkbox-label">Copy files by default (instead of move)</span>
        </label>
      </div>
    `;
    
    // Rename patterns section
    const renameSection = document.createElement('div');
    renameSection.className = 'settings-section';
    renameSection.innerHTML = `
      <h3>Rename Patterns</h3>
      <div id="rename-patterns">
        <p>Loading patterns...</p>
      </div>
      <form id="add-rename-pattern-form" class="form-field">
        <div class="input-container">
          <input type="text" name="pattern" class="text-input" placeholder="New rename pattern">
          <button type="submit" class="text-button">Add</button>
        </div>
      </form>
    `;
    
    // Buttons
    const buttonsSection = document.createElement('div');
    buttonsSection.className = 'button-container';
    buttonsSection.innerHTML = `
      <button id="settings-reset-btn" class="text-button warning">Reset to Defaults</button>
      <button id="settings-save-btn" class="primary-button">Save Settings</button>
    `;
    
    // Assemble modal
    content.appendChild(pathsSection);
    content.appendChild(behaviorSection);
    content.appendChild(renameSection);
    content.appendChild(buttonsSection);
    
    modalContent.appendChild(header);
    modalContent.appendChild(content);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Show modal
    modal.style.display = 'block';
    
    // Set current values
    if (currentSettings) {
      const defaultPatternSelect = document.getElementById('settings-default-pattern');
      defaultPatternSelect.value = currentSettings.defaultSortPattern || 'artist';
      
      // Populate rename patterns
      if (currentSettings.customPatterns) {
        displayCustomPatterns(currentSettings.customPatterns);
      }
    }
    
    // Close button event
    document.getElementById('close-settings').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    // Save button
    document.getElementById('settings-save-btn').addEventListener('click', () => {
      const updatedSettings = {
        sourcePath: document.getElementById('settings-source-path').value,
        targetPath: document.getElementById('settings-target-path').value,
        defaultSortPattern: document.getElementById('settings-default-pattern').value,
        defaultRenamePattern: document.getElementById('settings-default-rename').value,
        copyByDefault: document.getElementById('settings-copy-mode').checked
      };
      
      // Update current settings
      currentSettings = { ...currentSettings, ...updatedSettings };
      
      // Update UI
      sourcePathInput.value = updatedSettings.sourcePath;
      targetPathInput.value = updatedSettings.targetPath;
      if (copyModeCheckbox) copyModeCheckbox.checked = updatedSettings.copyByDefault;
      if (sortPatternSelect) sortPatternSelect.value = updatedSettings.defaultSortPattern;
      
      // Save to server
      fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          showSnackbar('Settings saved successfully');
          modal.style.display = 'none';
        } else {
          showSnackbar(`Error: ${result.error}`, 'DISMISS');
        }
      })
      .catch(error => {
        console.error('Error saving settings:', error);
        showSnackbar(`Error saving settings: ${error.message}`, 'DISMISS');
      });
    });
    
    // Reset button
    document.getElementById('settings-reset-btn').addEventListener('click', resetSettings);
    
    // Add pattern form
    document.getElementById('add-rename-pattern-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const patternInput = e.target.elements.pattern;
      if (patternInput && patternInput.value.trim()) {
        addCustomPattern('rename', patternInput.value.trim());
        patternInput.value = '';
      }
    });
  }

  // Setup all event listeners
  function setupEventListeners() {
    // Sort button click
    sortBtn.addEventListener('click', handleSort);
    
    // FAB button click - same as Sort button
    fab.addEventListener('click', handleSort);
    
    // Scan button click
    scanBtn.addEventListener('click', handleScan);
    
    // Analyze button click
    analyzeBtn.addEventListener('click', handleAnalyze);
    
    // Undo button click
    undoBtn.addEventListener('click', handleUndo);
    
    // Close results button
    closeResultsBtn.addEventListener('click', () => {
      resultsCard.style.display = 'none';
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Snackbar dismiss action
    snackbarAction.addEventListener('click', dismissSnackbar);
    
    // Settings button (if present)
    if (settingsBtn) {
      settingsBtn.addEventListener('click', showSettings);
    }
    
    // Save settings button (if present)
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // Reset settings button (if present)
    if (resetSettingsBtn) {
      resetSettingsBtn.addEventListener('click', resetSettings);
    }
    
    // Input fields - save settings when changed and focus is lost
    sourcePathInput.addEventListener('blur', () => {
      if (currentSettings && sourcePathInput.value !== currentSettings.sourcePath) {
        saveSettings();
      }
    });
    
    targetPathInput.addEventListener('blur', () => {
      if (currentSettings && targetPathInput.value !== currentSettings.targetPath) {
        saveSettings();
      }
    });
    
    if (copyModeCheckbox) {
      copyModeCheckbox.addEventListener('change', () => {
        if (currentSettings && copyModeCheckbox.checked !== currentSettings.copyByDefault) {
          saveSettings();
        }
      });
    }
    
    if (sortPatternSelect) {
      sortPatternSelect.addEventListener('change', () => {
        if (currentSettings && sortPatternSelect.value !== currentSettings.defaultSortPattern) {
          saveSettings();
        }
      });
    }
  }

  // Initialize the app when DOM is ready
  init();
});
