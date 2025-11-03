Yes, it is possible to keep the PC version of a game unchanged while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Builds**:
   - **Maintain Separate Codebases**: Keep the PC version's codebase intact while creating a separate version for mobile. This allows you to make changes for mobile without affecting the PC version.
   - **Shared Assets**: Use shared assets (like graphics and sounds) where possible to minimize duplication.

### 2. **Responsive Design**:
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI elements based on the screen size. Use flexible layouts (like anchors and relative positioning) to ensure that the sidebar and other UI components resize appropriately.
   - **Dynamic Scaling**: Use techniques like scaling the UI elements based on the screen resolution to maintain usability across devices.

### 3. **Input Handling**:
   - **Touch vs. Mouse Input**: Implement different input handling for touch screens (swipes, taps) and mouse/keyboard. This may require some reworking of controls but can be done without altering the core gameplay.

### 4. **Cross-Platform Compatibility**:
   - **Networking**: If the game has multiplayer features, ensure that the networking code supports cross-platform play. This may involve using a common server architecture that can handle connections from both PC and mobile clients.
   - **Performance Optimization**: Optimize the game for mobile devices, which may have less processing power and memory compared to PCs.

### 5. **Testing**:
   - **Extensive Testing**: Test the game on various devices to ensure that the gameplay experience is consistent and enjoyable across platforms. Pay attention to performance, controls, and UI scaling.

### 6. **User Experience**:
   - **Consistent Experience**: Aim for a consistent user experience across platforms. While the controls and UI may differ, the core gameplay mechanics should remain the same.
   - **Tutorials and Onboarding**: Consider adding tutorials or onboarding processes for mobile users to help them understand the controls and gameplay.

### Confusion and Complexity:
- **Development Complexity**: Maintaining separate builds and ensuring cross-platform compatibility can increase the complexity of development. It requires careful planning and organization.
- **User Confusion**: If the game experience differs significantly between platforms (e.g., different controls, UI layouts), it could confuse players. Clear communication about the differences and similarities is essential.
- **Testing Overhead**: More platforms mean more testing, which can be time-consuming and may require additional resources.

### Conclusion:
While it is feasible to add cross-platform compatibility while keeping the PC version unchanged, it requires careful planning and execution. The complexity can increase, but with a well-structured approach, you can minimize confusion for both developers and players.