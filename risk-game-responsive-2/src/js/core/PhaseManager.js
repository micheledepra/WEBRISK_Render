Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Maintain Separate Codebases or Use a Unified Codebase**
   - **Separate Codebases**: You can keep the PC version unchanged and create a separate codebase for mobile. This allows you to tailor the experience for each platform but can lead to increased maintenance overhead.
   - **Unified Codebase**: Alternatively, you can use a single codebase that adapts to different platforms. This approach can simplify updates and maintenance.

### 2. **Responsive Design**
   - **Aspect Ratio and Layout**: Implement a responsive design that adjusts the UI elements based on the screen size. Use flexible layouts (like grids or flexbox) that can rearrange or resize components dynamically.
   - **Aspect Ratio Handling**: Ensure that the game can handle different aspect ratios by using a camera system that can adapt to various resolutions. This may involve letterboxing or pillarboxing to maintain the intended visual experience.

### 3. **User Interface (UI) Adjustments**
   - **Dynamic UI Scaling**: Create a UI that scales based on the screen size. This includes adjusting the size of buttons, text, and sidebars to ensure usability on smaller screens.
   - **Touch Controls**: For mobile, implement touch controls that are intuitive and easy to use. This may involve redesigning certain interactions that are mouse/keyboard-based on PC.

### 4. **Cross-Platform Compatibility**
   - **Input Handling**: Ensure that the game can handle different input methods (mouse/keyboard for PC, touch for mobile). This may require creating a system that detects the platform and adjusts input accordingly.
   - **Performance Optimization**: Mobile devices may have different performance capabilities compared to PCs. Optimize graphics and processing to ensure smooth gameplay on both platforms.

### 5. **Testing and Quality Assurance**
   - **Extensive Testing**: Test the game on various devices and screen sizes to ensure that the experience is consistent and enjoyable across platforms.
   - **User Feedback**: Gather feedback from users on both platforms to identify any usability issues or confusion that may arise from the cross-platform experience.

### 6. **Potential Confusion**
   - **User Experience**: If not implemented carefully, users may find the experience confusing, especially if the controls or UI elements differ significantly between platforms. Consistency in design and functionality is key.
   - **Learning Curve**: Players accustomed to the PC version may need time to adjust to the mobile version, especially if controls or gameplay mechanics differ.

### Conclusion
While it is feasible to keep the PC version unchanged and add mobile compatibility, careful planning and execution are essential to ensure a smooth user experience. By focusing on responsive design, input handling, and thorough testing, you can minimize confusion and create a cohesive cross-platform experience.