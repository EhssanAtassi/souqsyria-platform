import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductsService } from './store/products/products.service';
import { ProductsQuery } from './store/products/products.query';
import { CartService } from './store/cart/cart.service';
import { CategoryService } from './shared/services/category.service';
import { CampaignService } from './shared/services/campaign.service';

/**
 * Diagnostic Homepage Component
 * Systematically tests which service is causing the crash
 */
@Component({
  selector: 'app-diagnostic-homepage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="background: yellow; padding: 40px; margin: 20px; font-size: 24px; font-weight: bold; color: black; border: 5px solid red;">
      ✅ DIAGNOSTIC HOMEPAGE LOADING!
      <br><br>
      {{ statusMessage() }}
    </div>

    <div style="background: lightblue; padding: 30px; margin: 20px; border: 3px solid navy;">
      <h2>Diagnostic Log:</h2>
      <ul>
        <li *ngFor="let log of diagnosticLogs()">{{ log }}</li>
      </ul>
    </div>
  `
})
export class DiagnosticHomepageComponent implements OnInit {
  statusMessage = signal<string>('Initializing...');
  diagnosticLogs = signal<string[]>([]);

  // CORRECT: Inject services as class fields (injection context)
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly productsService = inject(ProductsService);
  private readonly productsQuery = inject(ProductsQuery);
  private readonly cartService = inject(CartService);
  private readonly categoryService = inject(CategoryService);
  private readonly campaignService = inject(CampaignService);

  private addLog(message: string): void {
    this.diagnosticLogs.update(logs => [...logs, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log('[DIAGNOSTIC]', message);
  }

  ngOnInit(): void {
    this.addLog('✅ Component ngOnInit started');

    try {
      this.addLog('✅ Creating signal for products...');
      const testSignal = signal<any[]>([]);
      this.addLog('✅ Signal created successfully');

      this.addLog('🔍 Testing service injections...');

      // Services are already injected as class fields - just verify they exist
      this.addLog(this.router ? '✅ Router injected successfully' : '❌ Router is null');
      this.addLog(this.snackBar ? '✅ MatSnackBar injected successfully' : '❌ MatSnackBar is null');
      this.addLog(this.productsService ? '✅ ProductsService injected successfully' : '❌ ProductsService is null');
      this.addLog(this.productsQuery ? '✅ ProductsQuery injected successfully' : '❌ ProductsQuery is null');
      this.addLog(this.cartService ? '✅ CartService injected successfully' : '❌ CartService is null');
      this.addLog(this.categoryService ? '✅ CategoryService injected successfully' : '❌ CategoryService is null');
      this.addLog(this.campaignService ? '✅ CampaignService injected successfully' : '❌ CampaignService is null');

      this.addLog('✅ Component initialization complete!');
      this.statusMessage.set('✅ All services injected successfully!');

    } catch (error: any) {
      this.addLog(`❌ ERROR: ${error?.message || 'Unknown error'}`);
      this.statusMessage.set(`❌ FAILED: ${error?.message || 'Unknown error'}`);
      console.error('[DIAGNOSTIC] Error:', error);
    }
  }
}
