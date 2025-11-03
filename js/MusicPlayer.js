/**
 * MusicPlayer - Background music player with fade in/out and keyboard controls
 * 
 * Features:
 * - Random playlist playback
 * - 3-second fade in/out transitions
 * - Keyboard controls: M (mute/unmute), + (next track), - (previous track), N (music manager)
 * - Multiple music folders support
 */
class MusicPlayer {
  constructor(musicFolder = 'res/Music/Classic/', startTrack = null) {
    // Music library organized by folder
    this.musicLibrary = {
      'Classic': [
        'Napoleon.mp3',
        'ytmp3free.cc_american-theme-american-conquest-youtubemp3free.org.mp3',
        'ytmp3free.cc_british-theme-american-conquest-youtubemp3free.org.mp3',
        'ytmp3free.cc_cossacks-european-wars-ost-0318-youtubemp3free.org.mp3',
        'ytmp3free.cc_french-theme-american-conquest-youtubemp3free.org.mp3',
        'ytmp3free.cc_indians-prelude-american-conquest-youtubemp3free.org.mp3',
        'ytmp3free.cc_maya-indians-theme-american-conquest-youtubemp3free.org.mp3',
        'ytmp3free.cc_rubilovka-american-conquest-youtubemp3free.org.mp3',
        'ytmp3free.cc_spanish-theme-american-conquest-youtubemp3free.org.mp3'
      ],
      'Corto': [
        '01- Franco Piersanti - Corto Maltese, Proprio Lui - OST - Druid Sounds.mp3',
        '02 - Franco Piersanti - Verso oriente, la Profezia Dello Sciamano - OST - Druid Sounds.mp3',
        '03 - Franco Piersanti - Corto e Rasputin, la giunca in fiamme - OST - Druid Sounds.mp3',
        '04 - Franco Piersanti - Il Treno Movimenti di epici Un viaggio Lungo - OST - Druid Sounds.mp3',
        '05 - Franco Piersanti - Hong-Kong, verso l\'aventura e l\'insidia - OST - Druid Sounds.mp3',
        '08 - Franco Piersanti - Notte fantasmatica - OST - Druid Sounds.mp3',
        '09 - Franco Piersanti - Le Lanterne Rosse - OST - Druid Sounds.mp3',
        '10 - Franco Piersanti - Nostalgia di che, Corto - OST - Druid Sounds.mp3',
        '12 - Franco Piersanti - Con la duchessa fino in Manciura - OST - Druid Sounds.mp3',
        '15 - Franco Piersanti - Verso l\'epilogo - i campi di riso - OST - Druid Sounds.mp3'
      ],
      'Lotr': [
        'ytmp3free.cc_the-fellowship-of-the-ring-soundtrack07a-knife-in-the-dark-youtubemp3free.org.mp3',
        'ytmp3free.cc_the-fellowship-of-the-ring-soundtrack09many-meetings-youtubemp3free.org.mp3',
        'ytmp3free.cc_the-fellowship-of-the-ring-st13the-bridge-of-khazad-dum-youtubemp3free.org.mp3',
        'ytmp3free.cc_the-two-towers-soundtrack03the-riders-of-rohan-youtubemp3free.org.mp3',
        'ytmp3free.cc_the-two-towers-soundtrack05the-urukhai-youtubemp3free.org.mp3'
      ]
    };
    
    this.musicFolder = musicFolder;
    this.currentFolder = 'Classic'; // Default folder
    this.playAllMode = false; // Whether to play all tracks from all folders
    this.tracks = this.musicLibrary['Classic'];
    this.startTrack = startTrack; // Optional specific track to start with
    this.currentTrackIndex = 0;
    this.playlist = [];
    this.audio = null;
    this.isMuted = false;
    this.isPlaying = false;
    this.fadeInterval = null;
    this.fadeDuration = 3000; // 3 seconds
    this.maxVolume = 0.7; // Max volume (70%)
    
    console.log('🎵 MusicPlayer initialized');
    console.log('📁 Folders:', Object.keys(this.musicLibrary).join(', '));
    console.log('🎵 Total tracks:', this.getTotalTrackCount());
    
    this.init();
  }
  
  /**
   * Initialize the music player
   */
  init() {
    // Create audio element
    this.audio = new Audio();
    this.audio.volume = 0;
    this.audio.loop = false;
    
    // Shuffle playlist
    this.shufflePlaylist();
    
    // Set up event listeners
    this.audio.addEventListener('ended', () => this.playNext());
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.playNext(); // Skip to next track on error
    });
    
    // Set up keyboard controls
    this.setupKeyboardControls();
    
    console.log('MusicPlayer initialized with', this.tracks.length, 'tracks');
  }
  
  /**
   * Shuffle the playlist randomly
   */
  shufflePlaylist() {
    // Build playlist based on current mode
    if (this.playAllMode) {
      // Play all tracks from all folders
      this.playlist = [];
      for (const [folderName, trackList] of Object.entries(this.musicLibrary)) {
        trackList.forEach(track => {
          this.playlist.push({ folder: folderName, track: track });
        });
      }
    } else {
      // Play tracks from current folder only
      this.playlist = this.tracks.map(track => ({
        folder: this.currentFolder,
        track: track
      }));
    }
    
    // Shuffle the playlist
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }
    
    // If there's a start track, ensure it's first in the playlist (Napoleon.mp3 logic removed)
    if (this.startTrack) {
      const startIndex = this.playlist.findIndex(
        item => item.folder === this.currentFolder && item.track === this.startTrack.replace(this.musicFolder, '')
      );
      if (startIndex !== -1) {
        const startTrack = this.playlist.splice(startIndex, 1)[0];
        this.playlist.unshift(startTrack);
      }
    }
    
    this.currentTrackIndex = 0;
  }
  
  /**
   * Start playing music
   */
  start() {
    if (!this.isPlaying) {
      // Always load from playlist position 0 (no Napoleon.mp3 forced)
      this.loadTrack(this.currentTrackIndex);
      this.play();
    }
  }
  
  /**
   * Load a track by index
   */
  loadTrack(index) {
    if (index >= 0 && index < this.playlist.length) {
      const trackData = this.playlist[index];
      const folder = trackData.folder;
      const trackName = trackData.track;
      // Build path with proper encoding - encode each component separately
      // to preserve path structure while handling special characters
      const trackPath = `res/Music/${encodeURIComponent(folder)}/${encodeURIComponent(trackName)}`;
      this.audio.src = trackPath;
      console.log('Loaded track:', trackName, 'from', folder);
    }
  }
  
  /**
   * Play current track with fade in
   */
  play() {
    if (this.isMuted) return;
    
    this.audio.volume = 0;
    const playPromise = this.audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.fadeIn();
        })
        .catch(error => {
          console.log('Playback prevented:', error);
          // Browsers may prevent autoplay - will play on user interaction
        });
    }
  }
  
  /**
   * Fade in audio
   */
  fadeIn() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }
    
    const startVolume = 0;
    const targetVolume = this.maxVolume;
    const steps = 30; // 30 steps over 3 seconds
    const stepTime = this.fadeDuration / steps;
    const volumeIncrement = (targetVolume - startVolume) / steps;
    
    let currentStep = 0;
    this.audio.volume = startVolume;
    
    this.fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = startVolume + (volumeIncrement * currentStep);
      
      if (currentStep >= steps || newVolume >= targetVolume) {
        this.audio.volume = targetVolume;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      } else {
        this.audio.volume = newVolume;
      }
    }, stepTime);
  }
  
  /**
   * Fade out audio and execute callback
   */
  fadeOut(callback) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }
    
    const startVolume = this.audio.volume;
    const targetVolume = 0;
    const steps = 30;
    const stepTime = this.fadeDuration / steps;
    const volumeDecrement = startVolume / steps;
    
    let currentStep = 0;
    
    this.fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = startVolume - (volumeDecrement * currentStep);
      
      if (currentStep >= steps || newVolume <= targetVolume) {
        this.audio.volume = 0;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        if (callback) callback();
      } else {
        this.audio.volume = newVolume;
      }
    }, stepTime);
  }
  
  /**
   * Play next track
   */
  playNext() {
    this.fadeOut(() => {
      this.currentTrackIndex++;
      
      // Clear startTrack after first track plays (so Napoleon doesn't force to beginning on reshuffle)
      if (this.currentTrackIndex === 1 && this.startTrack) {
        this.startTrack = null;
      }
      
      // If we've reached the end, reshuffle and restart
      if (this.currentTrackIndex >= this.playlist.length) {
        this.shufflePlaylist();
        this.currentTrackIndex = 0;
      }
      
      this.loadTrack(this.currentTrackIndex);
      this.play();
    });
  }
  
  /**
   * Play previous track
   */
  playPrevious() {
    this.fadeOut(() => {
      this.currentTrackIndex--;
      
      // If we've gone before the first track, go to end
      if (this.currentTrackIndex < 0) {
        this.currentTrackIndex = this.playlist.length - 1;
      }
      
      this.loadTrack(this.currentTrackIndex);
      this.play();
    });
  }
  
  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.fadeOut(() => {
        this.audio.pause();
        this.isPlaying = false;
      });
      console.log('Music muted');
    } else {
      if (!this.isPlaying) {
        this.play();
      }
      console.log('Music unmuted');
    }
  }
  
  /**
   * Set up keyboard controls
   */
  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch(e.key.toLowerCase()) {
        case 'n':
          this.openMusicManager();
          e.preventDefault();
          break;
        case 'm':
          this.toggleMute();
          e.preventDefault();
          break;
        case '+':
        case '=': // Also handle = key (same key as + without shift)
          this.playNext();
          e.preventDefault();
          break;
        case '-':
        case '_': // Also handle _ key (same key as - with shift)
          this.playPrevious();
          e.preventDefault();
          break;
      }
    });
  }
  
  /**
   * Open music manager modal
   */
  openMusicManager() {
    const modal = document.getElementById('musicManagerModal');
    if (modal) {
      this.updateMusicManagerUI();
      modal.style.display = 'flex';
    }
  }
  
  /**
   * Close music manager modal
   */
  closeMusicManager() {
    const modal = document.getElementById('musicManagerModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  /**
   * Update music manager UI with current state
   */
  updateMusicManagerUI() {
    // Update folder buttons
    const folderContainer = document.getElementById('musicFolders');
    if (folderContainer) {
      folderContainer.innerHTML = '';
      
      // Add "All Music" button
      const allBtn = document.createElement('button');
      allBtn.textContent = `All Music (${this.getTotalTrackCount()} tracks)`;
      allBtn.className = 'music-folder-btn' + (this.playAllMode ? ' active' : '');
      allBtn.onclick = () => this.selectAllMusic();
      folderContainer.appendChild(allBtn);
      
      // Add folder buttons
      for (const [folderName, tracks] of Object.entries(this.musicLibrary)) {
        const btn = document.createElement('button');
        btn.textContent = `${folderName} (${tracks.length})`;
        btn.className = 'music-folder-btn' + (this.currentFolder === folderName && !this.playAllMode ? ' active' : '');
        btn.onclick = () => this.selectFolder(folderName);
        folderContainer.appendChild(btn);
      }
    }
    
    // Update track list
    const trackList = document.getElementById('musicTracks');
    if (trackList) {
      trackList.innerHTML = '';
      
      if (this.playAllMode) {
        // Show all tracks from all folders
        for (const [folderName, tracks] of Object.entries(this.musicLibrary)) {
          const folderHeader = document.createElement('div');
          folderHeader.className = 'track-folder-header';
          folderHeader.textContent = folderName;
          trackList.appendChild(folderHeader);
          
          tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.textContent = this.formatTrackName(track);
            trackItem.onclick = () => this.playSpecificTrack(folderName, track);
            trackList.appendChild(trackItem);
          });
        }
      } else {
        // Show tracks from current folder only
        this.tracks.forEach((track, index) => {
          const trackItem = document.createElement('div');
          trackItem.className = 'track-item';
          trackItem.textContent = this.formatTrackName(track);
          trackItem.onclick = () => this.playSpecificTrack(this.currentFolder, track);
          trackList.appendChild(trackItem);
        });
      }
    }
    
    // Update now playing info
    const nowPlaying = document.getElementById('nowPlayingInfo');
    if (nowPlaying && this.playlist.length > 0 && this.currentTrackIndex < this.playlist.length) {
      const currentTrack = this.playlist[this.currentTrackIndex];
      nowPlaying.textContent = `Now Playing: ${currentTrack.folder} - ${this.formatTrackName(currentTrack.track)}`;
    }
  }
  
  /**
   * Format track name for display (remove prefix and extension)
   */
  formatTrackName(trackFileName) {
    return trackFileName
      .replace('ytmp3free.cc_', '')
      .replace('-youtubemp3free.org.mp3', '')
      .replace(' - OST - Druid Sounds', '')
      .replace('.mp3', '')
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Get total track count across all folders
   */
  getTotalTrackCount() {
    let count = 0;
    for (const tracks of Object.values(this.musicLibrary)) {
      count += tracks.length;
    }
    return count;
  }
  
  /**
   * Select a specific folder to play
   */
  selectFolder(folderName) {
    if (this.musicLibrary[folderName]) {
      console.log('📁 Switching to folder:', folderName);
      this.currentFolder = folderName;
      this.tracks = this.musicLibrary[folderName];
      this.playAllMode = false;
      
      // Clear startTrack when user manually selects a folder
      this.startTrack = null;
      
      this.shufflePlaylist();
      this.updateMusicManagerUI();
      
      // Restart playback with new folder
      this.fadeOut(() => {
        this.loadTrack(0);
        this.play();
      });
    }
  }
  
  /**
   * Select all music mode (play from all folders)
   */
  selectAllMusic() {
    this.playAllMode = true;
    
    // Clear startTrack when user manually selects all music
    this.startTrack = null;
    
    this.shufflePlaylist();
    this.updateMusicManagerUI();
    
    // Restart playback with all music
    this.fadeOut(() => {
      this.loadTrack(0);
      this.play();
    });
  }
  
  /**
   * Play a specific track
   */
  playSpecificTrack(folderName, trackName) {
    // Find the track in the playlist
    const trackIndex = this.playlist.findIndex(
      item => item.folder === folderName && item.track === trackName
    );
    
    if (trackIndex !== -1) {
      this.fadeOut(() => {
        this.currentTrackIndex = trackIndex;
        this.loadTrack(this.currentTrackIndex);
        this.play();
        this.closeMusicManager();
      });
    } else {
      // Track not in current playlist, add it
      this.playlist.push({ folder: folderName, track: trackName });
      this.fadeOut(() => {
        this.currentTrackIndex = this.playlist.length - 1;
        this.loadTrack(this.currentTrackIndex);
        this.play();
        this.closeMusicManager();
      });
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MusicPlayer;
}
