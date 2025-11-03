Yes, it is possible to maintain the PC version of a game while adding cross-platform compatibility for mobile devices. Here are some key considerations and steps to achieve this:

### 1. **Separate Codebase or Unified Codebase**
   - **Unified Codebase**: If the game engine supports it (like Unity or Unreal Engine), you can maintain a single codebase that adapts to different platforms. This approach can simplify updates and maintenance.
   - **Separate Codebase**: If the game is complex or has significant differences in gameplay mechanics between PC and mobile, you might consider maintaining separate versions. This can lead to more confusion and increased maintenance overhead.

### 2. **Responsive Design**
   - **Aspect Ratio and Resolution**: Implement a responsive design that adjusts the UI and gameplay elements based on the screen size and aspect ratio. This can involve using flexible layouts, scaling UI elements, and ensuring that the game remains playable on various devices.
   - **Dynamic UI Scaling**: Use techniques like anchoring and scaling to ensure that the sidebar and other UI elements adjust according to the screen size. This might involve using percentage-based dimensions or relative positioning.

### 3. **Input Method Adaptation**
   - **Touch Controls**: For mobile, you will need to implement touch controls, which may differ significantly from mouse and keyboard inputs. Consider how to map actions and ensure that the gameplay experience is intuitive on both platforms.
   - **Control Schemes**: Allow players to switch between control schemes if they are using a gamepad on mobile or if they prefer keyboard and mouse on PC.

### 4. **Performance Optimization**
   - **Resource Management**: Mobile devices typically have less processing power and memory than PCs. Optimize graphics, reduce asset sizes, and manage resources efficiently to ensure smooth performance on mobile.
   - **Testing Across Devices**: Test the game on various mobile devices to ensure compatibility and performance. Different devices may have different capabilities, and testing will help identify issues.

### 5. **User Experience Consistency**
   - **Maintain Core Gameplay**: Ensure that the core gameplay experience remains consistent across platforms. Players should feel that they are playing the same game, regardless of the device.
   - **Adjustments for Mobile**: While maintaining core mechanics, you may need to adjust certain features for mobile (e.g., reducing complexity in controls or gameplay mechanics).

### 6. **Potential Confusion**
   - **User Interface Differences**: If the UI is significantly different between platforms, it may confuse players who switch between devices. Aim for a consistent design language while adapting to each platform's strengths.
   - **Feature Parity**: If certain features are available on one platform but not the other, it could lead to confusion. Clearly communicate any differences to players.

### Conclusion
Adding cross-platform compatibility while keeping the PC version unchanged is feasible, but it requires careful planning and execution. By focusing on responsive design, input adaptation, and performance optimization, you can create a seamless experience across devices. However, be mindful of potential confusion arising from differences in UI and gameplay mechanics, and strive for consistency wherever possible.