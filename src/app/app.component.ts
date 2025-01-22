import { Component, signal, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task } from './task/task';
import { TaskComponent } from './task/task.component';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TaskDialogResult } from './task-dialog/task-dialog.types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
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

  private dialog = inject(MatDialog);

  constructor() {}

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
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '450px',
      data: {
        task: { ...task },
        enableDelete: true
      },
    });

    dialogRef.afterClosed().subscribe((result?: TaskDialogResult) => {
      if (!result) return;

      const signal = this[list];
      const currentTasks = signal();
      
      if (result.delete) {
        // Remove the task
        signal.set(currentTasks.filter(t => t.id !== task.id));
      } else {
        // Update the task
        signal.set(currentTasks.map(t => 
          t.id === task.id ? { ...result.task, id: task.id } : t
        ));
      }
    });
  }

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '450px',
      data: {
        task: {},
        enableDelete: false
      },
    });

    dialogRef.afterClosed().subscribe((result?: TaskDialogResult) => {
      if (!result) return;
      
      // Update the todo signal with the new task
      this.todo.update(tasks => [...tasks, result.task]);
    });
  }
}
