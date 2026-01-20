import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-simple',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="background: pink; padding: 40px; margin: 20px; font-size: 30px; font-weight: bold; color: black; border: 5px solid red; text-align: center;">
      🎉 TEST COMPONENT LOADED SUCCESSFULLY! 🎉
      <br><br>
      This proves routing works!
    </div>
  `
})
export class TestSimpleComponent {}
