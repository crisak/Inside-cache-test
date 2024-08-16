import { useState } from 'react';
import './App.css';
import { Spinner } from './spinner/Spinner';

const getData = async (id) => {
  const myHeaders = new Headers();
  myHeaders.append(
    'Authorization',
    'XXXX'
  );

  const requestOptions = {
    method: 'get',
    headers: myHeaders,
    redirect: 'follow',
  };

  const carrierId = '627eb3b93a19fdc0cf5fe087';

  return fetch(
    `https://api.pickingnpacking.com/dev/v1/tracking/hook/${carrierId}/${id}`,
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      return result;
    })
    .catch((error) => {
      return Promise.reject(error);
    });
};

let intervalMemory = {};

function App() {
  const [id, setId] = useState('');
  const [data, setData] = useState();
  const [records, setRecords] = useState([]);
  const [listCaches, setListCaches] = useState({});
  const [loading, setLoading] = useState(false);
  const [cacheTime, setCacheTime] = useState(60);

  const req = async (idParams = null) => {
    console.log('idParams', idParams);
    let resp = null;
    const init = Date.now();
    const idFetch = idParams || id;
    try {
      setData({ loading: '........' });
      setLoading(true);
      resp = await getData(idFetch);
    } catch (e) {
      console.log('🚨 Error:', e);
      resp = e;
    } finally {
      setLoading(false);
      setData(resp);

      if (!resp?.data?.id) {
        alert(resp);
        return;
      }

      const miliseconds = Date.now() - init;
      setRecords([
        ...records,
        {
          miliseconds,
          dateTime: new Date().toLocaleString(),
          idSearch: idFetch,
          response: resp,
        },
      ]);

      if (resp?.data?.id) {
        initCounter(resp, miliseconds);
      }
    }
  };

  function initCounter({ data: { id } }, timeFetch) {
    if (
      intervalMemory[id] &&
      listCaches[id] &&
      listCaches[id].state === 'inCache' &&
      timeFetch < 4000
    ) {
      return;
    }

    if (intervalMemory[id]) {
      clearInterval(intervalMemory[id]);
    }

    intervalMemory[id] = setInterval(() => {
      setListCaches((beforeListCaches) => {
        const beforeCache = beforeListCaches[id] || {};

        let counter =
          beforeCache.counter === undefined || beforeCache.counter == -1
            ? cacheTime
            : beforeCache.counter;
        counter = counter >= 0 ? counter - 1 : counter;

        const state = counter >= 0 ? 'inCache' : 'withoutCache';

        const newState = {
          ...beforeListCaches,
          [id]: {
            ...beforeCache,
            counter,
            state,
            id,
          },
        };

        if (state === 'withoutCache') {
          clearInterval(intervalMemory[id]);
        }

        return newState;
      });
    }, 1000);
  }

  return (
    <div className="App">
      <div className="mx mb">
        <div className="box-inset w4 flex justify-center py-2">
          <label htmlFor="cacheTime" className="mr">
            Cache time
          </label>
          <input
            type="number"
            className="mb"
            name="cacheTime"
            id="cacheTime"
            onChange={(e) => setCacheTime(e.target.value || 0)}
            value={cacheTime}
          />
        </div>
        <div className="container-form">
          <div>
            <div className="txt-center">
              <h4>
                Request <br />
              </h4>

              <br />
              <input
                className="mb"
                name="params"
                id="params"
                onChange={(e) => setId(e.target.value || '')}
                value={id}
              />

              <button onClick={() => req(id)} className="mb">
                Request
              </button>
              <div style={{ opacity: loading ? '1' : '0' }}>
                <Spinner />
              </div>
            </div>

            <details>
              <summary>Response</summary>
              <div className="box-inset o-auto-x">
                {data && (
                  <pre>
                    <code>{JSON.stringify(data, null, 2)}</code>
                  </pre>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>
      {records.length > 0 && (
        <div className="mb mx">
          <button onClick={() => setRecords([])}>Clear records</button>
        </div>
      )}

      <div className="flex">
        <div className="flex flex-wrap container-logs">
          {records.length > 0 &&
            Object.entries(
              records?.reduce((acc, { idSearch, ...restProps }) => {
                if (!acc[idSearch]) {
                  acc[idSearch] = [];
                }

                acc[idSearch].push({ idSearch, ...restProps });
                return acc;
              }, {})
            ).map(([idGroup, values = []], index) => {
              return (
                <div className="w4 mx box-shadow pt" key={index}>
                  <h5 className="label-records">
                    <span>
                      <button
                        className="btn-xs mr"
                        onClick={() => {
                          req(idGroup);
                        }}
                      >
                        Request
                      </button>
                      Record{' '}
                      {/* <span className="color-primary">
                        {idGroup}-{values[0].response.data.username}
                      </span> */}
                    </span>
                    <span>{values.length || 0} Total</span>
                  </h5>

                  {listCaches[idGroup] && (
                    <div
                      className={`item-cache ${
                        listCaches[idGroup].state === 'withoutCache'
                          ? 'disabled'
                          : ''
                      }`}
                    >
                      <h6 className="label-cache">
                        <span>
                          Cache id{' '}
                          <strong className="color-primary">{`{${idGroup}}`}</strong>
                        </span>
                        <span>
                          {listCaches[idGroup].counter < 0
                            ? 0
                            : listCaches[idGroup].counter}
                          s / {cacheTime}s
                        </span>
                      </h6>
                      <div className="container-progress">
                        <div
                          className="progress"
                          style={{
                            width:
                              listCaches[idGroup].counter > 0
                                ? `${
                                    (listCaches[idGroup].counter / cacheTime) *
                                    100
                                  }%`
                                : '0',
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <ol className="list box-inset" key={index}>
                    {values.map(
                      ({ miliseconds, dateTime, response }, index) => (
                        <li key={index}>
                          <span className="c-light">{dateTime}</span>
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          <strong
                            className={`color-status ${
                              miliseconds > 2000 ? 'danger' : 'success'
                            }`}
                          >
                            {miliseconds} MS
                          </strong>
                          <br />
                          <details>
                            <summary>Response JSON</summary>
                            <pre>
                              <code>{JSON.stringify(response, null, 2)}</code>
                            </pre>
                          </details>
                        </li>
                      )
                    )}
                  </ol>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default App;
