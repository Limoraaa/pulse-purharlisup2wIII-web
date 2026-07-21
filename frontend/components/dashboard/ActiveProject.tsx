"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardHeader, CardFooter, Button } from "react-bootstrap";

import TanstackTable from "components/table/TanstackTable";
import { ActiveProjectColumns } from "components/dashboard/ColumnDefination";


interface BorrowingItem {

  id: string;

  tanggal: string;

  tool: string;

  kode: string;

  peminjam: string;

  jumlah: number;

  status: string;

}



const ActiveProject = () => {


  const [data, setData] = useState<BorrowingItem[]>([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    fetchBorrowing();

  }, []);




  const fetchBorrowing = async () => {

    try {


      const response = await axios.get(

        `${process.env.NEXT_PUBLIC_API_URL}/dashboard`

      );


      setData(

        response.data.recentBorrowing

      );



    } catch (error) {


      console.error(
        "Gagal mengambil riwayat peminjaman",
        error
      );


    } finally {


      setLoading(false);


    }

  };





  return (

    <Card className="card-lg mb-6">


      <CardHeader className="border-bottom-0">

        <h5 className="mb-0">

          Riwayat Peminjaman Terbaru

        </h5>

      </CardHeader>




      <div>


        {
          loading ?


          (

            <div className="text-center py-5">

              Loading...

            </div>


          )


          :


          (


            <TanstackTable

              data={data}

              columns={ActiveProjectColumns}

            />


          )


        }


      </div>





      <CardFooter className="border-dashed border-top text-center">


        <Button href="#!" variant="link">

          Lihat Semua Riwayat

        </Button>


      </CardFooter>



    </Card>

  );

};



export default ActiveProject;