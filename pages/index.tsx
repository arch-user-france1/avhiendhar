import { useEffect, useState } from "react";
import io from 'socket.io-client';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] })

import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, })



export default function Page() {
    const [cpuUsage, setCpuUsage] = useState(0)
    const [cores, setCores] = useState(0)
    const [cpuGovernor, setCpuGovernor] = useState(0)
    const [perfCores, setPerfCores] = useState(0)
    const [effiCores, setEffiCores] = useState(0)
    const [ramUsed, setRamUsed] = useState(0)
    const [totalRam, setTotalRam] = useState(0)
    const [ramPerc, setRamPerc] = useState(0)
    const [ramCache, setRamCache] = useState(0)
    const [ramAvail, setRamAvail] = useState(0)
    const [ramActive, setRamActive] = useState(0)
    const [ramActivePerc, setRamActivePerc] = useState(0)
    const [ramCachePerc, setRamCachePerc] = useState(0)
    const [swapUsed, setSwapUsed] = useState(0)
    const [swapTotal, setSwapTotal] = useState(0)
    const [swapPerc, setSwapPerc] = useState(0)

    const [cpuGraph, setCpuGraph] = useState([])


    useEffect(() => {
        fetch('/api/stats').finally(() => {
          const socket = io()
    
          socket.on('connect', () => {
            console.log('connect')
            setInterval(() => socket.emit('stats'), 500)
          })

          socket.on('stats', jsn => {
            const timestamp = new Date()
            const data = JSON.parse(jsn)
            setCores(data.cores)
            setCpuUsage(data.cpuUsage)
            setCpuGovernor(data.cpuGovernor)
            setPerfCores(data.perfCores)
            setEffiCores(data.effiCores)
            setRamUsed(data.ramUsed)
            setTotalRam(data.ramTotal)
            setRamPerc(100*data.ramUsed/data.ramTotal)
            setRamActive(data.ramActive)
            setRamActivePerc(100*data.ramActive/data.ramTotal)
            setRamAvail(data.ramAvailable)
            setRamCache(data.ramCache)
            setRamCachePerc(100*data.ramCache/data.ramTotal)
            setSwapUsed(data.swapUsed)
            setSwapTotal(data.swapTotal)
            setSwapPerc(100*data.swapUsed/data.swapTotal)

            cpuGraphAddValue({
              timestamp: timestamp,
              value: data.cpuUsage
            })
          })
        })
      }, [])

      function cpuGraphAddValue(value) {
        setCpuGraph(prev => {
          if (prev.length > 60) {
            return [...prev.splice(0, 1), value]
          }
          return [...prev, value]
        })
      }

      const data = [
        {
          x: cpuGraph.map((item) => item.timestamp),
          y: cpuGraph.map((item) => item.value),
          type: 'scatter',
          mode: 'lines+markers',
          marker: { color: 'red' },
          line: { width: 1 },
        },
      ];

      const layout = {
        width: 640,
        height: 480,
        title: 'CPU Usage',
        xaxis: {
          title: 'Timestamp',
        },
        yaxis: {
          title: 'CPU Usage (%)',
        },
        transition: {
          duration: 500,
          easing: 'cubic-in-out',
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        showgrid: false,
      };

      console.log(cpuGraph)

    return (
        <>

          <div style={{display: "flex", justifyContent: "center", gap: "3rem"}} className={inter.className}>
            <Section name="Processor">
              <div>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                  <span>{cores} CPUs</span> <span>{Math.floor(cpuUsage)}%</span>
                </div>
                <LineGauge value={cpuUsage} />
              </div>
              <div style={{display: "grid"}}>
                {cpuGovernor ? <FlexVal>Governor: <span>{cpuGovernor}</span></FlexVal> : ""}
                {(perfCores && effiCores) ? <FlexVal>Performance Cores: <span>{perfCores}</span></FlexVal> : ""}
                {(effiCores && perfCores) ? <FlexVal>Efficiency Cores: <span>{effiCores}</span></FlexVal> : ""}
              </div>
            </Section>

            <Section name="Memory">
              <div>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                  <span>RAM</span><span>{formatBytes(ramActive)} used</span>
                </div>
                <AdvancedLineGauge values={[
                  {value: ramActivePerc, color: "#5189de"},
                  {value: ramCachePerc,  color: "#e2a26d"}
                ]} />
                
                <div style={{display: "flex", justifyContent: "space-between"}}>
                  <span>swap</span><span>{formatBytes(swapUsed)} used</span>
                </div>
                <LineGauge value={swapPerc} />
              </div>
              <div style={{display: "grid"}}>

              </div>
            </Section>

          </div>


          <div style={{display: "flex", justifyContent: "center", marginTop: "5rem"}}>
            <Plot data={data} layout={layout} />
          </div>
        </>
    )
}

function Section({ name, children }) {
  
  return (
    
    <div className="section">
      <h2 style={{textAlign: "center"}}>{name}</h2>
      {children}
    </div>
  )
}

function LineGauge({ value }) {
  if (value > 100) {
    value = 100;
  }

  return (
    <div className="lineGauge">
      <div className={`lineGaugeTrack ${value>80 ? "alert" : ""}`} style={{width: value+"%"}}></div>
    </div>
  )
}
function AdvancedLineGauge({ values }) {
  interface Value {
    value: number,
    color: string,
  }

  return (
    <div className="lineGauge">
      {values.map((x: Value, i: number) => <div key={i} className={`lineGaugeTrack`} style={{width: x.value+"%", backgroundColor: x.color}}></div>)}
    </div>
  )
}
function GradientLineGauge({ values }) {

  let gradient = "linear-gradient(90deg"
  let perc_total = 0
  for (let value of values) {
    gradient += `,${value.color} ${(perc_total+value.value).toFixed(1)}%`
    perc_total += value.value
  }

  gradient += `,var(--track-background) 100%)`
  return (
    <div className="lineGauge" style={{background: gradient}}></div>
  )
}

function FlexVal({children}) {
  return (
    <div style={{display: "flex", justifyContent: "space-between"}}>
      {children}
    </div>
  )
}


function formatBytes(a,b=2){if(!+a)return"0 Bytes";const c=0>b?0:b,d=Math.floor(Math.log(a)/Math.log(1024));return`${parseFloat((a/Math.pow(1024,d)).toFixed(c))} ${["Bytes","KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"][d]}`}