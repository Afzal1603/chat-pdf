import React from "react";

type Props = { pdf_url: string };

const PDFViewer = async (props: Props) => {
  const { pdf_url } = await props;
  return (
    <iframe
      className="w-full h-full"
      src={`https://docs.google.com/viewer?url=${pdf_url}&embedded=true`}
    ></iframe>
  );
};

export default PDFViewer;
