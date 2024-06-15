"use client";
import { getHamData } from "@/app/server";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";
import { emojiBlasts } from "emoji-blast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const getValue = (inputSelector: string) => {
  const text = (document.querySelector(inputSelector) as any)?.value;
  switch (text) {
    case "none":
      return;
    case "tab":
      return "\t";
    default:
      return text;
  }
};

const getParams = () => {
  return {
    columnSeparator: getValue("#columnSeparator"),
  };
};

export default function Home() {
  const gridRef = useRef<any>();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof getHamData>>>();

  useEffect(() => {
    const handler = emojiBlasts({
      emojis: ["🍖"],
    });

    return () => handler.cancel();
  }, []);

  const { rowData, colDefs } = useMemo(() => {
    if (!data) {
      return {
        colDefs: [],
        rowData: [],
      };
    }

    return {
      colDefs: [
        { field: "fid" },
        { field: "username" },
        { field: "address" },
        { field: "liked" },
        { field: "recasted" },
        { field: "replied" },
      ],
      rowData: data?.fids?.map((fid) => ({
        fid,
        username: data.usernames[fid],
        address: data.fidToAddress[fid],
        liked: !!data.liked[fid],
        recasted: !!data.recasted[fid],
        replied: !!data.replied[fid],
      })),
    };
  }, [data]);

  const onBtnExport = useCallback(() => {
    var params = getParams();
    if (params.columnSeparator) {
      window.alert(
        "NOTE: you are downloading a file with non-standard separators - it may not render correctly in Excel."
      );
    }
    gridRef.current?.api?.exportDataAsCsv(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white w-screen min-h-screen p-5 py-20 flex flex-col items-center justify-center">
      <div className="text-3xl">🍖</div>
      <div className="text-3xl font-bold">HAMCASTER</div>
      <div className="text-base text-gray-500 text-center">
        Retrieve ham-chain data of users who interacted with a given cast
      </div>
      <input
        className="border w-[420px] max-w-full px-2 rounded-lg mt-5 py-1"
        placeholder="cast url - https://warpcasat.com/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <div
        className="bg-pink-600 text-white px-5 py-2 rounded-lg mt-5 cursor-pointer"
        onClick={async () => {
          try {
            setLoading(true);
            setData(undefined);
            const result = await getHamData(url);
            setData(result);
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        }}
      >
        HAM
      </div>

      {loading && <div className="mt-5">Loading...</div>}

      {data && (
        <div className="flex flex-col w-full mt-10 items-center">
          <div className="ag-theme-quartz w-full" style={{ height: 500 }}>
            {/* @ts-ignore */}
            <AgGridReact ref={gridRef} rowData={rowData} columnDefs={colDefs} />
          </div>
          <div
            className="bg-black text-white px-5 py-2 rounded-lg mt-5 cursor-pointer"
            onClick={onBtnExport}
          >
            Export to CSV
          </div>
        </div>
      )}
    </div>
  );
}
