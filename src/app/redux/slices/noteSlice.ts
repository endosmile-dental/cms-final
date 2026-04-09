import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface INote {
  _id: string;
  patientId: string;
  doctorId: {
    _id: string;
    fullName: string;
  };
  clinicId: string;
  title: string;
  content: string;
  category: "Clinical" | "Personal" | "Reminder" | "Follow-up" | "Other";
  priority: "Low" | "Medium" | "High" | "Urgent";
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface NoteState {
  notes: INote[];
  loading: boolean;
  error: string | null;
}

const initialState: NoteState = {
  notes: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchNotes = createAsyncThunk(
  "notes/fetchNotes",
  async (params?: { patientId?: string; category?: string; priority?: string; doctorId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.patientId) queryParams.append("patientId", params.patientId);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.priority) queryParams.append("priority", params.priority);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (params?.doctorId) {
      headers["x-doctor-id"] = params.doctorId;
    }

    const response = await fetch(`/api/doctor/notes/fetch?${queryParams.toString()}`, {
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch notes");
    }
    return data.notes;
  }
);

export const addNote = createAsyncThunk(
  "notes/addNote",
  async (noteData: Omit<INote, "_id" | "createdAt" | "updatedAt">) => {
    const response = await fetch("/api/doctor/notes/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-doctor-id": noteData.doctorId as unknown as string,
      },
      body: JSON.stringify(noteData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to add note");
    }
    return data.note;
  }
);

export const updateNote = createAsyncThunk(
  "notes/updateNote",
  async ({
    noteId,
    ...updateData
  }: {
    noteId: string;
    title?: string;
    content?: string;
    category?: INote["category"];
    priority?: INote["priority"];
    isPrivate?: boolean;
    tags?: string[];
  }) => {
    const response = await fetch("/api/doctor/notes/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, ...updateData }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update note");
    }
    return data.note;
  }
);

export const deleteNote = createAsyncThunk(
  "notes/deleteNote",
  async (noteId: string) => {
    const response = await fetch(`/api/doctor/notes/delete?noteId=${noteId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete note");
    }
    return noteId;
  }
);

const noteSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    clearNotes: (state) => {
      state.notes = [];
      state.error = null;
    },
    addNoteToLocal: (state, action: PayloadAction<INote>) => {
      state.notes.unshift(action.payload);
    },
    updateNoteToLocal: (state, action: PayloadAction<INote>) => {
      const index = state.notes.findIndex(
        (note) => note._id === action.payload._id
      );
      if (index !== -1) {
        state.notes[index] = action.payload;
      }
    },
    deleteNoteToLocal: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter((note) => note._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch notes";
      })
      // Add note
      .addCase(addNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes.unshift(action.payload);
      })
      .addCase(addNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add note";
      })
      // Update note
      .addCase(updateNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex(
          (note) => note._id === action.payload._id
        );
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update note";
      })
      // Delete note
      .addCase(deleteNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter((note) => note._id !== action.payload);
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete note";
      });
  },
});

export const {
  clearNotes,
  addNoteToLocal,
  updateNoteToLocal,
  deleteNoteToLocal,
} = noteSlice.actions;

export const selectNotes = (state: { notes: NoteState }) => state.notes.notes;
export const selectNotesLoading = (state: { notes: NoteState }) =>
  state.notes.loading;
export const selectNotesError = (state: { notes: NoteState }) =>
  state.notes.error;
export const selectNotesByPatient = (patientId: string) => (state: { notes: NoteState }) =>
  state.notes.notes.filter((note) => note.patientId === patientId);

export default noteSlice.reducer;