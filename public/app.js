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

  // State
  let darkMode = localStorage.getItem('darkMode') === 'true';

  // Initialize app
  function init() {
    // Apply theme
    updateTheme();
    
    // Set default values
    loadConfig();
    
    // Attach event listeners
    setupEventListeners();
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
    `;
    document.head.appendChild(style);
  }
  
  // Initialize the app
  addDynamicStyles();
  init();
});

  // Load configuration
  async function loadConfig() {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      
      // Set input values
      sourcePathInput.value = config.paths.SOURCE;
      targetPathInput.value = config.paths.TARGET;
      
      // Display success message
      showSnackbar('Configuration loaded successfully');
    } catch (error) {
      console.error('Error loading configuration:', error);
      showSnackbar('Error loading configuration', 'RETRY', loadConfig);
    }
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
  }

  // Handle Sort operation
  async function handleSort() {
    try {
      // Show loading state
      showStatus('Sorting files...', 'indeterminate');
      
      const response = await fetch('/api/sort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pattern: sortPatternSelect.value,
          sourcePath: sourcePathInput.value,
          targetPath: targetPathInput.value,
          copy: copyModeCheckbox.checked
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showStatus('Sorting complete!', 'success');
        showSnackbar('Files sorted successfully');
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error during sort operation:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error: ${error.message}`, 'DISMISS');
    }
  }

  // Handle Scan operation
  async function handleScan() {
    try {
      // Show loading state
      showStatus('Scanning files...', 'indeterminate');
      
      const response = await fetch(`/api/scan?path=${encodeURIComponent(sourcePathInput.value)}`);
      const result = await response.json();
      
      if (result.success) {
        showStatus(`Found ${result.files.length} files`, 'success');
        
        // Show results
        showResults(`
          <h3>Scan Results</h3>
          <p>Total files found: <strong>${result.files.length}</strong></p>
          <div class="file-list">
            <h4>Sample Files:</h4>
            <ul>
              ${result.files.slice(0, 10).map(file => `<li>${file}</li>`).join('')}
              ${result.files.length > 10 ? '<li>...</li>' : ''}
            </ul>
          </div>
        `);
        
        showSnackbar(`Found ${result.files.length} files`);
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error during scan operation:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error: ${error.message}`, 'DISMISS');
    }
  }

  // Handle Analyze operation
  async function handleAnalyze() {
    try {
      // Show loading state
      showStatus('Analyzing collection...', 'indeterminate');
      
      const response = await fetch(`/api/metadata?path=${encodeURIComponent(sourcePathInput.value)}`);
      const result = await response.json();
      
      if (result.success) {
        const musicFiles = result.musicFiles;
        
        // Count unique values
        const artists = new Set(musicFiles.map(f => f.metadata.artist || 'Unknown'));
        const albums = new Set(musicFiles.map(f => f.metadata.album || 'Unknown'));
        const genres = new Set(musicFiles.map(f => f.metadata.genre || 'Unknown'));
        const years = new Set(musicFiles.map(f => f.metadata.year ? f.metadata.year.toString() : 'Unknown'));
        
        showStatus('Analysis complete!', 'success');
        
        // Show results
        showResults(`
          <h3>Analysis Results</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="material-icons">music_note</span>
              <div class="stat-value">${musicFiles.length}</div>
              <div class="stat-label">Music Files</div>
            </div>
            <div class="stat-card">
              <span class="material-icons">person</span>
              <div class="stat-value">${artists.size}</div>
              <div class="stat-label">Artists</div>
            </div>
            <div class="stat-card">
              <span class="material-icons">album</span>
              <div class="stat-value">${albums.size}</div>
              <div class="stat-label">Albums</div>
            </div>
            <div class="stat-card">
              <span class="material-icons">category</span>
              <div class="stat-value">${genres.size}</div>
              <div class="stat-label">Genres</div>
            </div>
            <div class="stat-card">
              <span class="material-icons">calendar_today</span>
              <div class="stat-value">${years.size}</div>
              <div class="stat-label">Years</div>
            </div>
          </div>
        `);
        
        showSnackbar('Analysis complete');
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error during analyze operation:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error: ${error.message}`, 'DISMISS');
    }
  }

  // Handle Undo operation
  async function handleUndo() {
    if (!confirm('Are you sure you want to undo the last sort operation? This will move all files back to the source directory.')) {
      return;
    }
    
    try {
      // Show loading state
      showStatus('Undoing sort operation...', 'indeterminate');
      
      const response = await fetch('/api/undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourcePath: sourcePathInput.value,
          targetPath: targetPathInput.value
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showStatus('Undo operation complete!', 'success');
        showSnackbar('Undo operation complete');
      } else {
        showStatus(`Error: ${result.error}`, 'error');
        showSnackbar(`Error: ${result.error}`, 'DISMISS');
      }
    } catch (error) {
      console.error('Error during undo operation:', error);
      showStatus(`Error: ${error.message}`, 'error');
      showSnackbar(`Error: ${error.message}`, 'DISMISS');
    }
  }

  // Show status card with message
  function showStatus(message, type = 'progress') {
    statusCard.style.display = 'block';
    statusMessage.textContent = message;
    
    // Reset progress bar classes
    progressBar.className = 'progress-bar';
    
    switch (type) {
      case 'indeterminate':
        progressBar.classList.add('indeterminate');
        progressBar.style.width = '100%';
        break;
      case 'success':
        progressBar.style.width = '100%';
        progressBar.style.backgroundColor = 'var(--success-color)';
        // Hide after 3 seconds
        setTimeout(() => {
          statusCard.style.display = 'none';
        }, 3000);
        break;
      case 'error':
        progressBar.style.width = '100%';
        progressBar.style.backgroundColor = 'var(--error-color)';
        break;
      default:
        progressBar.style.width = '0%';
        setTimeout(() => {
          progressBar.style.width = '100%';
        }, 50);
    }
  }
