Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Separate Codebase**: You can maintain a separate version for PC and mobile. This allows you to optimize each version for its respective platform but can lead to increased maintenance overhead.
   - **Unified Codebase**: Using a single codebase that adapts to different platforms can simplify updates and maintenance. Frameworks like Unity or Unreal Engine support cross-platform development.

### 2. **Responsive Design**
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI based on the screen size. Use relative units (like percentages) instead of fixed units (like pixels) for layout elements.
   - **Dynamic UI Scaling**: Create a UI that can scale and reposition elements based on the device's resolution and aspect ratio. This may involve using anchors and flexible layouts.

### 3. **Input Handling**
   - **Touch vs. Mouse Input**: Implement different input handling for touch screens (mobile) and mouse/keyboard (PC). This may involve creating touch-friendly controls and gestures for mobile users.

### 4. **Performance Optimization**
   - **Resource Management**: Optimize assets (textures, sounds, etc.) for mobile devices, which may have less processing power and memory compared to PCs.
   - **Testing on Multiple Devices**: Ensure the game runs smoothly on various mobile devices with different specifications.

### 5. **Cross-Platform Compatibility**
   - **Networking**: If your game has multiplayer features, ensure that the networking code supports cross-platform play.
   - **Account Management**: Consider how players will log in and save progress across platforms. Implement a unified account system if necessary.

### 6. **User Experience**
   - **Consistent Experience**: Aim for a consistent user experience across platforms, but be mindful of the differences in interaction methods (touch vs. mouse).
   - **Tutorials and Onboarding**: Provide tutorials that cater to both PC and mobile users, as they may have different expectations and experiences.

### 7. **Testing and Feedback**
   - **User Testing**: Conduct thorough testing with users on both platforms to gather feedback on usability and performance.
   - **Iterate Based on Feedback**: Be prepared to make adjustments based on user feedback to improve the experience on both platforms.

### Confusion and Complexity
- **Potential Confusion**: Maintaining a single version while adapting it for multiple platforms can lead to confusion, especially if the UI/UX is not well thought out. Users may find it difficult to navigate if the controls and layouts are inconsistent.
- **Complexity in Development**: The development process may become more complex, requiring careful planning and testing to ensure that features work seamlessly across platforms.

### Conclusion
While it is feasible to keep the PC version unchanged and add mobile compatibility, it requires careful planning and execution. By focusing on responsive design, input handling, and performance optimization, you can create a cross-platform experience that is both functional and enjoyable for users.