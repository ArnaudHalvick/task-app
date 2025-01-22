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
import { Firestore, collection, collectionData, deleteDoc, doc, runTransaction, setDoc } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

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
  private firestore = inject(Firestore);
  private dialog = inject(MatDialog);

  todo = signal<Task[]>([]);
  inProgress = signal<Task[]>([]);
  done = signal<Task[]>([]);

  constructor() {
    // Subscribe to Firestore collections
    this.subscribeToCollection('todo');
    this.subscribeToCollection('inProgress');
    this.subscribeToCollection('done');
  }

  private subscribeToCollection(collectionName: 'todo' | 'inProgress' | 'done') {
    const collectionRef = collection(this.firestore, collectionName);
    collectionData(collectionRef, { idField: 'id' }).subscribe(tasks => {
      this[collectionName].set(tasks as Task[]);
    });
  }

  async drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      return;
    }

    const item = event.previousContainer.data[event.previousIndex];
    const sourceCollection = event.previousContainer.id;
    const targetCollection = event.container.id;

    try {
      await runTransaction(this.firestore, async (transaction) => {
        // Delete from source collection
        const sourceDoc = doc(this.firestore, sourceCollection, item.id!);
        transaction.delete(sourceDoc);

        // Add to target collection
        const targetDoc = doc(this.firestore, targetCollection, item.id!);
        transaction.set(targetDoc, item);
      });
    } catch (e) {
      console.error('Transaction failed: ', e);
    }
  }

  async editTask(list: 'todo' | 'inProgress' | 'done', task: Task): Promise<void> {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '450px',
      data: {
        task: { ...task },
        enableDelete: true
      },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result) return;

    const docRef = doc(this.firestore, list, task.id!);

    try {
      if (result.delete) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, result.task);
      }
    } catch (e) {
      console.error('Error updating task: ', e);
    }
  }

  async newTask(): Promise<void> {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '450px',
      data: {
        task: {},
        enableDelete: false
      },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result) return;

    try {
      const collectionRef = collection(this.firestore, 'todo');
      const docRef = doc(collectionRef);
      await setDoc(docRef, {
        ...result.task,
        id: docRef.id
      });
    } catch (e) {
      console.error('Error creating task: ', e);
    }
  }
}
