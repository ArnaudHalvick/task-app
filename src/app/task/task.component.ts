import { Component, input, output } from '@angular/core';
import { Task } from './task';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent {
  task = input<Task>();
  edit = output<Task>();
}