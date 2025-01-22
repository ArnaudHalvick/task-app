import { Component, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task } from './task/task';
import { TaskComponent } from './task/task.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    CdkDropList,
    CdkDrag,
    TaskComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'kanban-fire';
  todo = signal<Task[]>([
    {
      id: '1',
      title: 'Buy milk',
      description: 'Go to the store and buy milk'
    },
    {
      id: '2',
      title: 'Create a Kanban app',
      description: 'Using Firebase and Angular create a Kanban app!'
    }
  ]);
  inProgress = signal<Task[]>([]);
  done = signal<Task[]>([]);

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      const tasks = [...event.container.data];
      moveItemInArray(tasks, event.previousIndex, event.currentIndex);
      this.updateList(event.container.id, tasks);
    } else {
      const prevTasks = [...event.previousContainer.data];
      const currTasks = [...event.container.data];
      transferArrayItem(
        prevTasks,
        currTasks,
        event.previousIndex,
        event.currentIndex
      );
      this.updateList(event.previousContainer.id, prevTasks);
      this.updateList(event.container.id, currTasks);
    }
  }

  private updateList(id: string, tasks: Task[]) {
    switch (id) {
      case 'todo':
        this.todo.set(tasks);
        break;
      case 'inProgress':
        this.inProgress.set(tasks);
        break;
      case 'done':
        this.done.set(tasks);
        break;
    }
  }

  editTask(list: 'todo' | 'inProgress' | 'done', task: Task): void {
    console.log('Editing task:', task, 'in list:', list);
  }
}
