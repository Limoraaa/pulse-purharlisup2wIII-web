"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge, Dropdown } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

import ActionMenu from "components/common/ActionMenu";


export interface BorrowingItem {

  id: string;

  tanggal: string;

  tool: string;

  kode: string;

  peminjam: string;

  jumlah: number;

  status: string;

}



export const ActiveProjectColumns: ColumnDef<BorrowingItem>[] = [

  {
    accessorKey: "tanggal",
    header: "Tanggal",
  },


  {
    accessorKey: "tool",
    header: "Nama Tool",
  },


  {
    accessorKey: "kode",
    header: "Kode Tool",
  },


  {
    accessorKey: "peminjam",
    header: "Peminjam",
  },


  {
    accessorKey: "jumlah",
    header: "Jumlah",
  },


  {
    accessorKey: "status",

    header: "Status",

    cell: ({ row }) => {


      const status = row.original.status;


      const color =
        status === "Kembali"
          ? "success"
          : "warning";



      return (

        <Badge
          bg={`${color}-subtle`}
          text={`${color}-emphasis`}
        >

          {status}

        </Badge>

      );


    }

  },


  {
    header: "Action",

    cell: () => {

      return (

        <ActionMenu

          toggleButton={
            <IconDotsVertical size={20}/>
          }

          className="btn btn-ghost btn-icon btn-sm rounded-circle"

          drop="start"

          align="start"

        >

          <Dropdown.Item>
            Detail
          </Dropdown.Item>


          <Dropdown.Item>
            Edit
          </Dropdown.Item>


          <Dropdown.Item>
            Hapus
          </Dropdown.Item>


        </ActionMenu>

      );

    }

  }


];