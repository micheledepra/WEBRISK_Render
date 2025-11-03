Yes, it is possible to keep the PC version of a game unchanged while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Builds for PC and Mobile:**
   - **Maintain the PC Version:** Keep the existing PC version intact to avoid disrupting the current user experience.
   - **Create a Mobile Version:** Develop a separate build optimized for mobile devices. This version can include touch controls and UI adjustments suitable for smaller screens.

### 2. **Responsive Design:**
   - **Aspect Ratio and Layout:** Implement a responsive design that adjusts the aspect ratio and layout based on the device's screen size. Use flexible UI elements that can scale or reposition themselves.
   - **Dynamic UI Scaling:** Use relative units (like percentages) instead of fixed units (like pixels) for UI elements to ensure they adapt to different screen sizes.

### 3. **Cross-Platform Compatibility:**
   - **Input Handling:** Ensure that the game can handle different input methods (keyboard/mouse for PC, touch controls for mobile).
   - **Networking:** If the game has multiplayer features, ensure that the networking code supports cross-platform play.

### 4. **Testing and Optimization:**
   - **Extensive Testing:** Test the game on various devices to ensure that the experience is consistent and enjoyable across platforms.
   - **Performance Optimization:** Optimize the game for mobile devices, which may have less processing power compared to PCs.

### 5. **User Experience Considerations:**
   - **Consistent Experience:** Aim for a consistent user experience across platforms, but be aware that some features may need to be adjusted or omitted for mobile.
   - **Tutorials and Onboarding:** Provide tutorials or onboarding experiences that cater to the different control schemes and screen sizes.

### 6. **Potential Confusion:**
   - **User Interface Differences:** If the UI is significantly different between platforms, it may confuse players who switch between devices. Aim for a familiar layout and design language across platforms.
   - **Control Scheme Variations:** Players accustomed to PC controls may find mobile controls challenging at first. Clear communication about control differences can help mitigate confusion.

### Conclusion:
While it is feasible to maintain the PC version unchanged and add mobile compatibility, careful planning and execution are essential to ensure a smooth transition. By focusing on responsive design, consistent user experience, and thorough testing, you can minimize confusion and create a successful cross-platform game.