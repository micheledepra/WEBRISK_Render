Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Unified Codebase**: If the game is designed with a flexible architecture, you can maintain a single codebase that adapts to different platforms. This approach can reduce redundancy and streamline updates.
   - **Separate Codebase**: If the game is complex or has significant differences in gameplay mechanics between PC and mobile, maintaining separate codebases might be necessary.

### 2. **Responsive Design**
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI elements based on the screen size and aspect ratio. Use relative positioning and scaling for UI components to ensure they look good on both PC and mobile.
   - **Dynamic UI Scaling**: Use techniques like anchoring and scaling to adjust the sidebar and other UI elements dynamically based on the screen dimensions.

### 3. **Input Method Adaptation**
   - **Control Schemes**: Adapt the control schemes for different platforms. For example, touch controls for mobile and keyboard/mouse for PC. Ensure that the game can detect the platform and adjust controls accordingly.

### 4. **Cross-Platform Compatibility**
   - **Networking**: If the game has multiplayer features, ensure that the networking code supports cross-platform play. This may involve using a common server architecture that can handle connections from both PC and mobile clients.
   - **Performance Optimization**: Mobile devices typically have less processing power than PCs, so optimize the game to run smoothly on lower-end hardware.

### 5. **Testing and Quality Assurance**
   - **Extensive Testing**: Test the game on various devices and screen sizes to ensure that the UI scales correctly and that gameplay remains consistent across platforms.
   - **User Feedback**: Gather feedback from users on both platforms to identify any confusion or usability issues.

### 6. **Documentation and Tutorials**
   - **Clear Instructions**: Provide clear documentation and tutorials for players on how to navigate the game on different platforms. This can help reduce confusion, especially for players transitioning from PC to mobile.

### Potential Confusion
- **User Experience**: If the game mechanics or controls differ significantly between platforms, it could lead to confusion for players who switch between them. Consistency in gameplay experience is key.
- **UI Differences**: If the UI is not well-optimized for different screen sizes, players may find it difficult to interact with the game, leading to frustration.
- **Performance Expectations**: Players may have different expectations regarding performance and graphics quality on mobile versus PC, which could lead to dissatisfaction if not managed properly.

### Conclusion
While it is entirely feasible to keep the PC version unchanged and add cross-platform compatibility, careful planning and execution are essential to minimize confusion and ensure a smooth experience for players on both platforms. By focusing on responsive design, input adaptation, and thorough testing, you can create a cohesive gaming experience that works well across devices.