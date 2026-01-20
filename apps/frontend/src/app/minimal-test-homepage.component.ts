import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-minimal-test-homepage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="background: yellow; padding: 40px; margin: 20px; font-size: 30px; font-weight: bold; color: black; border: 5px solid red; text-align: center;">
      ✅✅✅ MINIMAL HOMEPAGE WORKS! ✅✅✅
      <br><br>
      This proves Angular routing and lazy loading work perfectly!
      <br><br>
      The problem is in the original homepage component's TypeScript code.
    </div>
    <div style="background: lightblue; padding: 30px; margin: 20px; border: 3px solid navy;">
      <h2 style="color: navy;">Next Step:</h2>
      <p style="font-size: 18px;">We'll identify which service or signal is crashing in the original homepage component.</p>
    </div>
  `
})
export class MinimalTestHomepageComponent {}