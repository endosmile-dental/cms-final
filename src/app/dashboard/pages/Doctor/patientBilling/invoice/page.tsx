"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import { Treatment } from "@/app/redux/slices/billingSlice";

const Invoice = () => {
  // Reference to the content you want to convert to PDF
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [dataAvailable, setDataAvailable] = useState<boolean>(false);

  const [patientName, setPatientName] = useState<string>("NA");
  const [patientId, setPatientId] = useState<string>("NA");
  const [invoiceId, setInvoiceId] = useState<string>("NA");
  const [gender, setGender] = useState<string>("NA");
  const [email, setEmail] = useState<string>("NA");
  const [date, setDate] = useState<string>("NA");
  const [contactNumber, setContactNumber] = useState<string>("NA");
  const [address, setAddress] = useState<string>("NA");
  // Rename amountRecieved to amountReceived for consistency.
  const [amountReceived, setAmountReceived] = useState<string>("0");
  const [modeOfPayment, setModeOfPayment] = useState<string>("NA");
  const [advance, setAdvance] = useState<string>("0");
  const [discount, setDiscount] = useState<string>("0");
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [grandTotal, setGrandTotal] = useState<string>("0");

  // Helper function to safely calculate numbers and return string.
  const safeNumberToString = (num: number) =>
    isNaN(num) ? "0" : num.toString();

  useEffect(() => {
    const formData = sessionStorage.getItem("formData");

    if (formData) {
      setDataAvailable(true);
      const dataObject = JSON.parse(formData);
      console.log("dataObject", dataObject);

      setPatientName(dataObject.patientName || "NA");
      setPatientId(dataObject.patientId || "NA");
      setInvoiceId(dataObject.invoiceId || "NA");
      setGender(dataObject.gender || "NA");
      setDate(dataObject.date || "NA");
      setEmail(dataObject.email || "NA");
      setContactNumber(dataObject.contactNumber || "NA");
      setAddress(dataObject.address || "NA");
      // Use the correctly spelled field from session storage.
      setAmountReceived(dataObject.amountReceived || "0");
      setModeOfPayment(dataObject.modeOfPayment || "NA");
      setAdvance(dataObject.advance || "0");
      setDiscount(dataObject.discount || "0");
      setTreatments(dataObject.treatments || []);

      const treatmentsData = dataObject.treatments || [];
      // Calculate grand total from treatments
      const totalAmount = treatmentsData.reduce(
        (total: number, treatment: Treatment) => {
          const quantity = Number(treatment.quantity) || 0;
          const price = Number(treatment.price) || 0;
          return total + quantity * price;
        },
        0
      );
      console.log("totalAmount", totalAmount);
      setGrandTotal(safeNumberToString(totalAmount));
    }
  }, []);

  const generatePDFAndPrint = () => {
    // Hide the print button
    if (buttonRef.current) buttonRef.current.style.display = "none";

    if (contentRef.current) {
      const doc = new jsPDF();

      // Use html method to directly generate the PDF from the HTML
      doc.html(contentRef.current, {
        callback: function (doc) {
          if (buttonRef.current) buttonRef.current.style.display = "block";
          doc.autoPrint();
          doc.output("dataurlnewwindow"); // Opens the PDF in a new window
        },
        x: 10,
        y: 10,
        width: 180,
        windowWidth: 800,
      });
    }
  };

  return (
    <>
      {dataAvailable && patientName && (
        <div
          ref={contentRef}
          className="bg-white text-black font-sans text-base w-full pb-20 flex flex-col border border-gray-300"
        >
          <div className="flex bg-black px-2 py-5">
            <div className="w-1/3 text-slate-100 flex flex-col justify-center items-start">
              <ul className="flex flex-col justify-center items-start py-2">
                <li className="text-base font-bold tracking-wide">
                  Dr. Sumit Dinkar
                </li>
                <li className="text-sm">BDS, MDS (MAIDS - Delhi)</li>
                <li className="text-sm">
                  Conservative Dentistry And Endodontics
                </li>
                <li className="text-sm">Ex- Senior Resident (MAIDS - Delhi)</li>
                <li className="text-sm">
                  Ex- Resident (Dr. RML Hospital - New Delhi)
                </li>
              </ul>
            </div>
            <div className="w-1/3 flex justify-center items-center">
              <Image
                src="/images/Logo.png"
                alt="Logo"
                width={200}
                height={100}
              />
            </div>
            <div className="w-1/3 hidden md:flex md:flex-col items-end text-start justify-center text-slate-100">
              <ul className="text-xs">
                <li>phone: +91-83688 47831</li>
                <li>
                  add: Plot No. 203, NX One Service Ln,
                  <br /> Iteda, Greater Noida, U.P
                </li>
                <li>website: www.endosmiledentalcare.in</li>
              </ul>
            </div>
          </div>

          <div className="flex w-full px-2 justify-end text-xs">
            <p>
              <strong>Invoice Id : &nbsp;&nbsp;</strong>
              {invoiceId}
            </p>
          </div>

          <div className="mb-6 px-10 gap-x-5 flex text-sm font-normal">
            <ul className="flex flex-col justify-end font-semibold">
              <li>Date:</li>
              <li>Patient Id:</li>
              <li>Patient Name:</li>
              <li>Gender:</li>
              <li>Address:</li>
              <li>Contact No.:</li>
              <li>Email:</li>
            </ul>
            <ul className="flex flex-col justify-start">
              <li>{date}</li>
              <li>{patientId}</li>
              <li>{patientName}</li>
              <li>{gender}</li>
              <li>{address || "--"}</li>
              <li>{contactNumber}</li>
              <li>{email || "--"}</li>
            </ul>
          </div>

          <h3 className="text-center text-base font-bold mb-4">INVOICE</h3>

          <div className="px-10">
            <table className="w-full border-collapse border border-gray-300 mb-6">
              <thead className="border border-gray-300 text-sm">
                <tr>
                  <th className="px-4 py-2 text-center">S.No.</th>
                  <th className="px-4 py-2 text-center">Treatment/Service</th>
                  <th className="px-4 py-2 text-center">Date</th>
                  <th className="px-4 py-2 text-center">Unit Cost INR</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                  <th className="px-4 py-2 text-center">Total Cost INR</th>
                </tr>
              </thead>
              <tbody className="text-sm font-normal">
                {treatments.map((treatment, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-center">{index + 1}</td>
                    <td className="px-4 py-2 text-center">
                      {treatment.treatment}
                    </td>
                    <td className="px-4 py-2 text-center">{date}</td>
                    <td className="px-4 py-2 text-center">{treatment.price}</td>
                    <td className="px-4 py-2 text-center">
                      {treatment.quantity}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {Number(treatment.price) * Number(treatment.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-6 gap-x-5 flex text-sm font-normal justify-end px-24">
            <ul className="flex flex-col justify-end font-semibold">
              <li>Grand Total:</li>
              <li>Discount:</li>
              <li>Advance:</li>
              <li>Net Payable:</li>
              <li>Amount Received:</li>
              <li>Balance Amount:</li>
            </ul>
            <ul className="flex flex-col justify-start">
              <li>{grandTotal}</li>
              <li>{discount || "0"}</li>
              <li>{advance || "0"}</li>
              <li>
                {safeNumberToString(Number(grandTotal) - Number(discount))}
              </li>
              <li>{amountReceived}</li>
              <li>
                {safeNumberToString(
                  Number(grandTotal) - Number(discount) - Number(amountReceived)
                )}
              </li>
            </ul>
          </div>

          <h3 className="text-center text-base font-bold mb-4">
            PAYMENT DETAILS
          </h3>

          <div className="px-10 text-sm">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="border border-gray-300 text-center">
                <tr>
                  <th className="px-4 py-2">S.NO.</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Mode Of Payment</th>
                  <th className="px-4 py-2">Amount Paid INR</th>
                </tr>
              </thead>
              <tbody className="text-sm font-normal text-center">
                <tr>
                  <td className="px-4 py-2">1</td>
                  <td className="px-4 py-2">{date}</td>
                  <td className="px-4 py-2">{modeOfPayment}</td>
                  <td className="px-4 py-2">{amountReceived}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="w-full text-sm flex justify-end px-14 py-24">
            <Image
              src="/images/sign1.png"
              alt="Signature"
              width={200}
              height={200}
              className="bg-blend-multiply"
            />
          </div>
          <button ref={buttonRef} onClick={generatePDFAndPrint}>
            Print
          </button>
        </div>
      )}
    </>
  );
};

export default Invoice;
