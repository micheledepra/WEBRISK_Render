### 1. **Separate Builds for PC and Mobile:**
   - **Maintain the PC Version:** Keep the existing PC version intact to avoid disrupting the current user experience.
   - **Create a Mobile Build:** Develop a separate build for mobile devices that can share some code and assets with the PC version but is optimized for touch controls and smaller screens.

### 2. **Responsive Design:**
   - **Aspect Ratio and Layout:** Implement a responsive design that adjusts the aspect ratio and layout based on the screen size. Use flexible UI elements that can resize and reposition themselves according to the device's resolution.
   - **Dynamic UI Scaling:** Use techniques like anchoring and scaling to ensure that UI elements (like sidebars) adjust properly on different screen sizes.

### 3. **Input Handling:**
   - **Touch Controls:** Implement touch controls for mobile devices while keeping keyboard and mouse controls for the PC version. This may involve creating a separate input handling system or using a unified system that detects the platform.
   - **Customizable Controls:** Allow players to customize their controls, especially on mobile, to enhance usability.

### 4. **Cross-Platform Compatibility:**
   - **Shared Accounts/Progress:** If applicable, implement a system that allows players to share accounts or progress between PC and mobile versions.
   - **Networking:** Ensure that any multiplayer or online features work seamlessly across platforms.

### 5. **Testing and Optimization:**
   - **Extensive Testing:** Test the game on various devices to ensure that the experience is smooth and that the UI adapts correctly.
   - **Performance Optimization:** Optimize the game for mobile devices, which may have different performance capabilities compared to PCs.

### 6. **User Experience Considerations:**
   - **Consistent Experience:** Aim for a consistent user experience across platforms, but be aware that some features may need to be adjusted or omitted on mobile due to hardware limitations.
   - **Tutorials and Onboarding:** Provide clear tutorials or onboarding processes for mobile users, as they may be unfamiliar with the controls or gameplay mechanics.

### Confusion and Complexity:
- **Development Complexity:** Maintaining two separate builds can increase development complexity, as you will need to manage and update both versions. However, using shared codebases and assets can mitigate this.
- **User Confusion:** If the gameplay experience differs significantly between platforms, players may become confused. Clear communication about the differences and similarities between versions is essential.
- **Testing Challenges:** Ensuring that both versions work seamlessly together, especially in cross-platform scenarios, can be challenging and requires thorough testing.

In summary, while it is feasible to add cross-platform compatibility and adjust the UI for different screen sizes without changing the PC version, it requires careful planning, design, and testing to ensure a smooth experience for all players.