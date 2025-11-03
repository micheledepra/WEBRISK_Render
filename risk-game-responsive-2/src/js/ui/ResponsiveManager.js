Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Separate Codebase**: You can maintain a separate version for PC and mobile. This allows you to optimize each version for its platform but can lead to increased maintenance overhead.
   - **Unified Codebase**: Using a single codebase that adapts to different platforms can simplify updates and maintenance. Frameworks like Unity or Unreal Engine support cross-platform development.

### 2. **Responsive Design**
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI elements based on the screen size and aspect ratio. This can involve using relative positioning and scaling for UI components.
   - **Dynamic UI Scaling**: Use anchors and layout groups to ensure that UI elements resize and reposition correctly on different screen sizes.

### 3. **Input Handling**
   - **Touch vs. Mouse Input**: Implement different input handling for mobile (touch) and PC (mouse/keyboard). This may involve creating separate input schemes or using a unified input system that detects the platform.

### 4. **Performance Optimization**
   - **Resource Management**: Mobile devices typically have less processing power than PCs, so optimize graphics and performance for mobile without compromising the PC experience.
   - **Quality Settings**: Allow players to adjust graphics settings based on their device capabilities.

### 5. **Testing Across Platforms**
   - **Cross-Platform Testing**: Regularly test the game on both PC and mobile devices to ensure that gameplay, UI, and performance are consistent and enjoyable across platforms.

### 6. **User Experience Considerations**
   - **Consistency**: Ensure that the core gameplay experience remains consistent across platforms, even if the UI and controls differ.
   - **Tutorials and Onboarding**: Provide clear tutorials for mobile users, as they may be unfamiliar with controls that differ from the PC version.

### 7. **Potential Confusion**
   - **User Confusion**: If the game experience varies significantly between platforms (e.g., different controls, UI layouts), players may become confused. Aim for a balance where the core experience is the same, but adapt the UI and controls to fit the platform.
   - **Communication**: Clearly communicate any differences in gameplay or controls to users, possibly through in-game prompts or tutorials.

### Conclusion
While it is feasible to keep the PC version unchanged and add cross-platform compatibility, careful planning and execution are essential to minimize confusion and ensure a smooth experience for all players. By focusing on responsive design, input handling, and consistent user experience, you can create a game that works well on both PC and mobile devices.