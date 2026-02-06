"use client";

import React, { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import { Treatment } from "@/app/redux/slices/billingSlice";
import html2canvas from "html2canvas"; // Add this import
import Image from "next/image";

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
  const [discount, setDiscount] = useState<string>("0");
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [grandTotal, setGrandTotal] = useState<string>("0");

  // Helper function to safely calculate numbers and return string.
  const safeNumberToString = (num: number) =>
    isNaN(num) ? "0" : num.toString();

  useEffect(() => {
    const formData = sessionStorage.getItem("formData");

    if (formData && formData !== "undefined") {
      try {
        const dataObject = JSON.parse(formData);
        setDataAvailable(true);
        console.log("dataObject", dataObject);

        setPatientName(dataObject.patientName || "NA");
        setPatientId(dataObject.patientId || "NA");
        setInvoiceId(dataObject.invoiceId || "NA");
        setGender(dataObject.gender || "NA");
        setDate(dataObject.date || "NA");
        setEmail(dataObject.email || "NA");
        setContactNumber(dataObject.contactNumber || "NA");
        setAddress(dataObject.address || "NA");
        setAmountReceived(dataObject.amountReceived || "0");
        setModeOfPayment(dataObject.modeOfPayment || "NA");
        setDiscount(dataObject.discount || "0");
        setTreatments(dataObject.treatments || []);

        const treatmentsData = dataObject.treatments || [];
        const totalAmount = treatmentsData.reduce(
          (total: number, treatment: Treatment) => {
            const quantity = Number(treatment.quantity) || 0;
            const price = Number(treatment.price) || 0;
            return total + quantity * price;
          },
          0
        );
        setGrandTotal(safeNumberToString(totalAmount));
      } catch (err) {
        console.error("Invalid JSON in sessionStorage:", err);
      }
    }
  }, []);

  const generatePDFAndPrint = () => {
    if (buttonRef.current) buttonRef.current.style.display = "none";

    if (contentRef.current) {
      // Use html2canvas to capture the content as an image
      html2canvas(contentRef.current, {
        scale: 2, // Increase for better quality
        useCORS: true, // Handle cross-origin images
        logging: false, // Disable console logging
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/jpeg");
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        const ratio = imgWidth / imgHeight;
        const pdfWidth = pageWidth;
        const pdfHeight = pageWidth / ratio;

        let heightLeft = pdfHeight;
        let position = 0;

        doc.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        // Add new pages for long content
        while (heightLeft >= 0) {
          position = heightLeft - pdfHeight;
          doc.addPage();
          doc.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }

        // Restore UI and open print dialog
        if (buttonRef.current) buttonRef.current.style.display = "block";
        doc.autoPrint();
        window.open(doc.output("bloburl"), "_blank");
      });
    }
  };

  return (
    <>
      {dataAvailable && patientName && (
        <div
          ref={contentRef}
          className="bg-white text-black font-sans text-2xl w-full px-5 flex flex-col"
        >
          <div className="flex p-2 border-b border-gray-300">
            <div className="w-[38%] flex flex-col justify-center items-start">
              <ul className="flex flex-col justify-center items-start py-2 text-xl">
                <li className="text-2xl font-bold tracking-wide">
                  Dr. Sumit Dinkar
                </li>
                <li>BDS, MDS (MAIDS - Delhi)</li>
                <li>Conservative Dentistry And Endodontics</li>
                <li>Ex- Senior Resident (MAIDS - Delhi)</li>
                <li>Ex- Resident (Dr. RML Hospital - New Delhi)</li>
              </ul>
            </div>
            <div className="w-[24%] flex justify-center items-center">
              <div className="relative w-[220px] h-[120px]">
                <Image
                  src="/images/white_logo.jpeg"
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

            </div>
            <div className="w-[38%] hidden md:flex md:flex-col items-end text-start justify-center">
              <ul className="text-xl">
                <li>
                  <span className="font-bold">Phone:</span> +91-83688 47831
                </li>
                <li>
                  <span className="font-bold">Add:</span>
                  Plot No. 203, Techzone-IV, Near NX-One,
                  <br /> Iteda, Greater Noida West, G.B. Nagar - 201016,
                  <br /> Uttar Pradesh
                </li>
                <li>
                  <span className="font-bold">Website:</span>{" "}
                  www.endosmiledentalcare.in
                </li>
              </ul>
            </div>
          </div>

          <div className="flex w-full pr-5 pt-3 justify-end text-xl">
            <p>
              <strong>Invoice Id : &nbsp;&nbsp;</strong>
              {invoiceId}
            </p>
          </div>

          <div className="mb-6 px-10 gap-x-5 flex font-normal">
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

          <h3 className="text-center text-2xl font-bold mb-4">INVOICE</h3>

          <div className="px-10">
            <table className="w-full border-collapse border border-gray-300 mb-6">
              <thead className="border border-gray-300 text-2xl">
                <tr>
                  <th className="px-4 py-2 text-center">S.No.</th>
                  <th className="px-4 py-2 text-center">Treatment/Service</th>
                  <th className="px-4 py-2 text-center">Date</th>
                  <th className="px-4 py-2 text-center">Unit Cost INR</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                  <th className="px-4 py-2 text-center">Total Cost INR</th>
                </tr>
              </thead>
              <tbody className="text-2xl font-normal">
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

          <div className="mb-6 gap-x-5 flex text-2xl font-normal justify-end px-24">
            <ul className="flex flex-col justify-end font-semibold">
              <li>Grand Total:</li>
              <li>Discount:</li>
              <li>Net Payable:</li>
              <li>Amount Received:</li>
              <li>Balance Amount:</li>
            </ul>
            <ul className="flex flex-col justify-start">
              <li>{grandTotal}</li>
              <li>{discount || "0"}</li>
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

          <h3 className="text-center text-2xl font-bold mb-4">
            PAYMENT DETAILS
          </h3>

          <div className="px-10 text-2xl">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="border border-gray-300 text-center">
                <tr>
                  <th className="px-4 py-2">S.NO.</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Mode Of Payment</th>
                  <th className="px-4 py-2">Amount Paid INR</th>
                </tr>
              </thead>
              <tbody className="text-2xl font-normal text-center">
                <tr>
                  <td className="px-4 py-2">1</td>
                  <td className="px-4 py-2">{date}</td>
                  <td className="px-4 py-2">{modeOfPayment}</td>
                  <td className="px-4 py-2">{amountReceived}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="w-full flex justify-end px-24 py-20">
            <div className="relative w-[250px] h-[200px]">
              <Image
                src="/images/sign1.png"
                alt="Signature"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="w-full text-lg font-bold text-center px-10 py-2">
            <p>Not valid for Medico Legal Case</p>
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
