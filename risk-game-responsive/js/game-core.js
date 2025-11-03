Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Separate Codebase**: You can maintain a separate version for PC and mobile. This allows you to optimize each version for its platform but can lead to increased maintenance overhead.
   - **Unified Codebase**: Using a single codebase that adapts to different platforms can simplify updates and maintenance. Frameworks like Unity or Unreal Engine support cross-platform development.

### 2. **Responsive Design**
   - **Aspect Ratio and Resolution**: Implement a responsive design that adjusts the UI based on the screen size and aspect ratio. Use relative units (like percentages) instead of fixed units (like pixels) for layout elements.
   - **Dynamic Layouts**: Create layouts that can rearrange or resize elements based on the available screen space. This may involve using flexible grids or layout managers.

### 3. **User Interface (UI) Adjustments**
   - **Sidebar and Menus**: Adjust the dimensions and positioning of sidebars and menus to fit mobile screens. Consider using collapsible menus or bottom navigation bars for mobile devices.
   - **Touch Controls**: Adapt controls for touch input on mobile devices, ensuring that buttons and interactive elements are appropriately sized and spaced.

### 4. **Cross-Platform Compatibility**
   - **Input Handling**: Implement input handling that can differentiate between mouse/keyboard and touch inputs. This may involve creating different control schemes for each platform.
   - **Performance Optimization**: Optimize performance for mobile devices, which may have less processing power than PCs. This could involve reducing graphical fidelity or optimizing resource usage.

### 5. **Testing and Quality Assurance**
   - **Extensive Testing**: Test the game on various devices and screen sizes to ensure a consistent experience. Pay attention to how the game performs and looks on different platforms.
   - **User Feedback**: Gather feedback from users on both platforms to identify any confusion or usability issues.

### 6. **Potential Confusion**
   - **User Experience**: If not implemented carefully, users may find the experience confusing, especially if the UI behaves differently on different platforms. Consistency in design and functionality is key.
   - **Learning Curve**: Players accustomed to the PC version may need time to adjust to the mobile version, especially if controls and layouts differ significantly.

### Conclusion
While it is feasible to keep the PC version unchanged and add mobile compatibility, careful planning and execution are essential to ensure a smooth user experience across platforms. By focusing on responsive design, user interface adjustments, and thorough testing, you can minimize confusion and create a cohesive experience for all players.