import React from "react";

const BlocksPage = () => {
  return (
    <div className="flex flex-1 h-full items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-lg border border-dashed p-6">
        <h1 className="text-lg font-semibold">Block Management</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Select a block from the left to view details or create a new block.
        </p>
      </div>
    </div>
  );
};

export default BlocksPage;
