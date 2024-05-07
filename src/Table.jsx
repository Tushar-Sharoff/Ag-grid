//pure
import React, { useEffect, useState,useCallback } from "react";
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css"; 
import "ag-grid-community/styles/ag-theme-quartz.css";
import CustomHeaderCheckbox from "./CustomHeaderSelection";
import { ApiClient, DefaultApi } from "@anansi-lineage/anansi-sdk";
import { fetchColData, headerNames, fetchColInfo, callFetchAllEnumValues } from "./colInfo";


export const Table = () => {
 const [init, setInit] = useState(false);
 const [data, setData] = useState([]);
 const [rawColData, setRawColData] = useState();
 const [enumData, setEnumData] = useState(new Map());
 const [gridApi, setGridApi] = useState(null);
 const [gridColumnApi, setGridColumnApi] = useState(null);
 
 var apiClient = new ApiClient();
 apiClient.basePath = "https://datalineage2.azurewebsites.net";
 apiClient.authentications["JWT"].apiKey = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiI3NTM1NWM4MS04NTk4LTRiNTEtYjM3ZC05ZGFhMWFkZDU4NjciLCJuYW1lIjoiVHVzaGFyIFNSIiwiZW1haWxzIjpbInR1c2hhci5zckBzdWtldGEuaW4iXSwidGZwIjoiQjJDXzFfc2lnbnVwX3NpZ25pbiIsIm5vbmNlIjoiMSIsInNjcCI6InJlYWQiLCJhenAiOiJjOTBmZWQyMS1iMzhhLTQ5ZDctODE2Ni05MzBlZTg3ZjFiMmUiLCJ2ZXIiOiIxLjAiLCJpYXQiOjE3MTQ2NjAxMTcsImF1ZCI6ImM5MGZlZDIxLWIzOGEtNDlkNy04MTY2LTkzMGVlODdmMWIyZSIsImV4cCI6MTcxNDY2MzcxNywiaXNzIjoiaHR0cHM6Ly9hbmFuc2lodWIuYjJjbG9naW4uY29tLzhlYzE4OWRmLTdkMTYtNDA2NC1hMDJlLTVmYTYzYjY1MWEzZi92Mi4wLyIsIm5iZiI6MTcxNDY2MDExN30.m21bwRnIimVcG_mhfzZ3OOPpukv7qcuO4oF9My6tfZslLeQ8TdNSZc-0iYvzZxhZwJ1cr8yLxHqM8dSmffvDpzj5FdFjOvmaVF6L7tCaUWxbsR8wgkqnF7kqI3u0YuLnjxvP9M7C-dvDVcZ77oWcEXKt4Dpm2HGGp8HrY7vIT7aDp_97P3_cWTNaIxSw28HKVZm-bW38_YqCywJ_uGeQXU8e6ySSMhaj1diFF_pshZkWnsB2LzT7Wv9pOrYOo5cjcX_51DUUW3afVBSeJsq-Nlo0jnzU7nVngTLG2swcTLHQqjtP4l_7mOAhcyaiyP2srtmpVMsgBEevesEDEQ4xiA";
 apiClient.authentications["JWT"].apiKeyPrefix = "Bearer";
 const defaultClient = new DefaultApi(apiClient);
 let tableName = "PropertyInfo";
 
 const fetchData = async (defaultClient, tableName, startRow=0, endRow=20) => {
    return new Promise((resolve, reject) => {
      let callback = function (error, data, response) {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          const totalCount = response.headers['x-total-count'];
          resolve({ data, totalCount });
          console.log("Response was:", response);
        }
      };
      try {
        defaultClient.getCatalogTablename(
          endRow - startRow,
          startRow,
          tableName,
          {
            optionalFilter: "",
          },
          callback
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
 };
 useEffect(() => {
    if (!init) {
      fetchColData(defaultClient, tableName, setRawColData);
      setInit(true);
    }
 }, []);
 useEffect(() => {
    if (rawColData !== undefined && rawColData !== null) {
      callFetchAllEnumValues(defaultClient, rawColData, setEnumData, enumData);
    }
 }, [rawColData]);
 const myDatasource = {
    rowCount: null,
    getRows: function(params) {
      const startRow = params.startRow;
      const endRow = params.endRow;
      fetchData(defaultClient, tableName, startRow, endRow).then(({ data, totalCount }) => {
        let lastRow = -1;
        if (data.length < endRow - startRow) {
          lastRow = startRow + data.length;
        }
        this.rowCount = totalCount;
        console.log(`Fetched ${data.length} rows from ${startRow} to ${lastRow}`);
        params.successCallback(data, lastRow);
      }).catch(error => {
        params.failCallback();
      });
    }
 };


 const onGridReady = useCallback(params => {
  setGridApi(params.api);
  setGridColumnApi(params.columnApi);
 }, []);
 
 
 const gridOptions = {
    rowModelType: 'infinite',
    datasource: myDatasource,
    pagination: false,
    rowSelection:'multiple',
    paginationPageSize: 20,
    cacheBlockSize: 20,
    maxBlocksInCache: 10,
    onGridReady: onGridReady,
    components:{
      customHeaderCheckbox:CustomHeaderCheckbox,
    }
   
 };
 const modifiedColDefs = rawColData ? fetchColInfo(rawColData, enumData) : [];
 if (modifiedColDefs.length > 0) {
    modifiedColDefs[0].checkboxSelection = true;
    modifiedColDefs[0].cellRenderer = props => {
      if (props.value !== undefined) {
        return props.value;
      } else {
        return <img src="/Loading.gif" />;
      }
    };
    modifiedColDefs[0].headerComponentParams = {
      onCheckboxChange: (checked) => {
        if (checked) {
          gridApi.forEachNode((node) => {
            node.selectThisNode(true);
          });
        } else {
          gridApi.forEachNode((node) => {
            node.selectThisNode(false);
          });
        }
      },
      displayName: modifiedColDefs[0].headerName,
    };
    modifiedColDefs[0].headerComponent = 'customHeaderCheckbox';
 }
 return (
    <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
      
      <AgGridReact
        gridOptions={gridOptions}
        columnDefs={modifiedColDefs}
      ></AgGridReact>
    </div>
 );
};

