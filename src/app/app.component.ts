import { Component, signal, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { Task } from './task/task';
import { TaskComponent } from './task/task.component';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
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
      const sortedTasks = (tasks as Task[]).sort((a, b) => 
        (a.position ?? 0) - (b.position ?? 0)
      );
      this[collectionName].set(sortedTasks);
    });
  }

  async drop(event: CdkDragDrop<Task[]>) {
    const { previousContainer, container, previousIndex, currentIndex } = event;
    const item = previousContainer.data[previousIndex];
    
    if (previousContainer === container) {
      // Same container drop
      const listSignal = this[container.id as 'todo' | 'inProgress' | 'done'];
      const newData = [...container.data];
      const [removed] = newData.splice(previousIndex, 1);
      newData.splice(currentIndex, 0, removed);
      
      // Optimistic update
      listSignal.set(newData);

      try {
        // Update positions in Firestore
        await runTransaction(this.firestore, async (transaction) => {
          const collectionRef = collection(this.firestore, container.id);
          
          // Update all affected documents with their new positions
          newData.forEach((task, index) => {
            const docRef = doc(collectionRef, task.id);
            transaction.update(docRef, { position: index });
          });
        });
      } catch (e) {
        console.error('Reorder transaction failed: ', e);
        // Revert optimistic update on error
        this.subscribeToCollection(container.id as 'todo' | 'inProgress' | 'done');
      }
    } else {
      // Cross-container drop
      try {
        // Create new arrays for both containers
        const newSourceData = [...previousContainer.data];
        newSourceData.splice(previousIndex, 1);
        
        const newTargetData = [...container.data];
        newTargetData.splice(currentIndex, 0, item);

        // Optimistic update - set both arrays at once
        this[previousContainer.id as 'todo' | 'inProgress' | 'done'].set(newSourceData);
        this[container.id as 'todo' | 'inProgress' | 'done'].set(newTargetData);

        await runTransaction(this.firestore, async (transaction) => {
          // Delete from source collection
          const sourceDoc = doc(this.firestore, previousContainer.id, item.id!);
          transaction.delete(sourceDoc);

          // Add to target collection with position
          const targetDoc = doc(this.firestore, container.id, item.id!);
          transaction.set(targetDoc, {
            ...item,
            position: currentIndex
          });

          // Update positions in source container
          newSourceData.forEach((task, index) => {
            const docRef = doc(this.firestore, previousContainer.id, task.id!);
            transaction.update(docRef, { position: index });
          });

          // Update positions in target container
          newTargetData.forEach((task, index) => {
            const docRef = doc(this.firestore, container.id, task.id!);
            transaction.update(docRef, { position: index });
          });
        });
      } catch (e) {
        console.error('Cross-list transaction failed: ', e);
        // Revert optimistic updates on error
        this.subscribeToCollection(previousContainer.id as 'todo' | 'inProgress' | 'done');
        this.subscribeToCollection(container.id as 'todo' | 'inProgress' | 'done');
      }
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
        id: docRef.id,
        position: this.todo().length
      });
    } catch (e) {
      console.error('Error creating task: ', e);
    }
  }
}
