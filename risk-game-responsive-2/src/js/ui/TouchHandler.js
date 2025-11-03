Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Separate Codebase**: You can maintain a separate version for PC and mobile. This allows you to optimize each version for its platform but can lead to increased maintenance overhead.
   - **Unified Codebase**: Using a single codebase that adapts to different platforms can simplify updates and maintenance. Frameworks like Unity or Unreal Engine support cross-platform development.

### 2. **Responsive Design**
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI elements based on the screen size and aspect ratio. This can involve using flexible layouts, anchors, and scaling techniques.
   - **Dynamic UI**: Create a UI that can rearrange itself based on the available screen space. For example, sidebars can collapse or expand, and buttons can resize or reposition.

### 3. **Input Handling**
   - **Touch vs. Mouse**: Ensure that the game can handle different input methods. Mobile devices will primarily use touch controls, while PCs will use mouse and keyboard. You may need to create different control schemes or adapt the existing ones.

### 4. **Performance Optimization**
   - Mobile devices typically have less processing power than PCs. Optimize graphics, reduce asset sizes, and ensure that the game runs smoothly on both platforms.

### 5. **Cross-Platform Compatibility**
   - **Networking**: If the game has multiplayer features, ensure that the networking code supports cross-platform play. This may involve using a server that can handle connections from both PC and mobile clients.
   - **Account Management**: Consider how players will manage their accounts across platforms. Implementing a unified account system can help with this.

### 6. **Testing and Quality Assurance**
   - Extensive testing is crucial to ensure that the game performs well on both platforms. This includes testing for different screen sizes, resolutions, and input methods.

### 7. **User Experience**
   - **Consistency**: Maintain a consistent user experience across platforms. While the UI may look different due to screen size, the core gameplay mechanics and design should remain the same.
   - **Tutorials and Onboarding**: Provide clear tutorials for mobile users, especially if the controls differ significantly from the PC version.

### Confusion and Challenges
- **User Confusion**: If the game has significant differences in gameplay or controls between platforms, players may become confused. Clear communication about the differences and similarities is essential.
- **Development Complexity**: Managing a cross-platform game can increase development complexity, especially if you need to address platform-specific issues.
- **Performance Variability**: Ensuring that the game runs smoothly on a wide range of devices can be challenging, particularly with the diversity of mobile hardware.

### Conclusion
While it is entirely feasible to keep the PC version unchanged and add mobile compatibility, careful planning and execution are required to ensure a smooth experience for players on both platforms. By focusing on responsive design, input handling, and thorough testing, you can minimize confusion and create a cohesive cross-platform experience.