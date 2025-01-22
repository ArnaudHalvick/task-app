import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule
  ],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>local_fire_department</mat-icon>
      <span>Kanban Fire</span>
    </mat-toolbar>
  `
})
export class AppComponent {
  title = 'kanban-fire';
}
