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
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'kanban-fire';
}
