import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

interface DashboardMetric {
  id: string;
  title: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  hint: string;
}

interface OrderStatusMetric {
  id: string;
  label: string;
  count: number;
  badgeColor: string;
}

interface HighlightCard {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
}

interface ActivitySnapshot {
  id: string;
  description: string;
  timestamp: string;
  category: 'order' | 'vendor' | 'support' | 'system';
}

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, RouterLink]
})
export class AdminDashboardComponent {
  private readonly metricsState = signal<DashboardMetric[]>([
    {
      id: 'sales',
      title: 'Today Revenue (SYP)',
      value: '6,420,000',
      delta: '+18.6% vs yesterday',
      trend: 'up',
      hint: 'Top sellers: Damascus Steel, Aleppo Soap'
    },
    {
      id: 'orders',
      title: 'Orders In Queue',
      value: '112',
      delta: '+9 pending approvals',
      trend: 'down',
      hint: '5 high-priority COD orders awaiting confirmation'
    },
    {
      id: 'vendors',
      title: 'Active Vendors',
      value: '284',
      delta: '+12 new vendors this week',
      trend: 'up',
      hint: 'Most new vendors from Aleppo & Lattakia'
    },
    {
      id: 'satisfaction',
      title: 'Customer NPS',
      value: '68',
      delta: '+5 pts after Eid campaign',
      trend: 'up',
      hint: 'Monitor returns desk to keep positive sentiment'
    }
  ]);

  readonly highlights = signal<HighlightCard[]>([
    {
      id: 'campaign',
      title: 'Ramadan Heritage Campaign',
      description: 'Curate featured artisans and schedule homepage hero for Ramadan week two.',
      actionLabel: 'Plan promotions',
      actionRoute: '/admin/marketing/campaigns'
    },
    {
      id: 'inventory',
      title: 'Inventory Alerts',
      description: '12 heritage items below threshold across Damascus, Homs, and Tartous warehouses.',
      actionLabel: 'Review stock',
      actionRoute: '/admin/inventory/alerts'
    }
  ]);

  readonly orderStatuses = signal<OrderStatusMetric[]>([
    { id: 'pending', label: 'Pending confirmation', count: 37, badgeColor: '#d97706' },
    { id: 'processing', label: 'Being prepared', count: 28, badgeColor: '#2563eb' },
    { id: 'shipped', label: 'In transit', count: 19, badgeColor: '#7c3aed' },
    { id: 'delivered', label: 'Delivered today', count: 46, badgeColor: '#047857' },
    { id: 'returns', label: 'Return requested', count: 6, badgeColor: '#dc2626' },
    { id: 'cod', label: 'Awaiting COD confirmation', count: 12, badgeColor: '#0f766e' }
  ]);

  readonly activities = signal<ActivitySnapshot[]>([
    {
      id: '1',
      description: 'Order #SS-10452 marked as ready for pickup in Damascus hub.',
      timestamp: '12 min ago',
      category: 'order'
    },
    {
      id: '2',
      description: 'Vendor "Aleppo Sweets Collective" submitted Eid product bundle for approval.',
      timestamp: '32 min ago',
      category: 'vendor'
    },
    {
      id: '3',
      description: 'Support ticket #CS-778 resolved (Arabic call center).',
      timestamp: '1 h ago',
      category: 'support'
    },
    {
      id: '4',
      description: 'System health check passed – payments operational across SYP/USD.',
      timestamp: '2 h ago',
      category: 'system'
    }
  ]);

  readonly metrics = computed(() => this.metricsState());
  readonly totalOrdersInFlight = computed(() =>
    this.orderStatuses().reduce((total, metric) => total + metric.count, 0)
  );
}
