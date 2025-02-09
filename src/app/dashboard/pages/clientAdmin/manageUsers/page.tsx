"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Button } from "@/components/ui/button";

// Table components
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// Dialog components from shadcn/ui
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Static list of users (for now)
const staticUsers = [
  {
    id: 1,
    fullName: "Dr. John Doe",
    email: "john.doe@example.com",
    role: "Doctor",
  },
  {
    id: 2,
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Receptionist",
  },
];

export default function ManageUsers() {
  const [users, setUsers] = useState(staticUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  // Handlers for navigating to respective add user pages
  const handleAddDoctor = () => {
    // Navigate to the Add Doctor page
    router.push("manageUsers/addDoctor");
  };

  const handleAddReceptionist = () => {
    // Navigate to the Add Receptionist page
    router.push("/manage-users/add-receptionist");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>

        {/* Add User Action */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Choose the type of user you would like to add.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <div className="flex flex-col space-y-4">
                  <Button onClick={handleAddDoctor}>Add Doctor</Button>
                  <Button onClick={handleAddReceptionist} variant="outline">
                    Add Receptionist
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="ml-2">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
