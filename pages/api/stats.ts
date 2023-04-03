import { NextApiRequest, NextApiResponse } from "next";
import si from "systeminformation";
import { Server } from 'socket.io'


export default async (req: NextApiRequest, res: NextApiResponse) => {
    if (!(res.socket as any).server.io) {
        console.log('*starting socket.io')
    
        const io = new Server((res.socket as any).server)
    
        io.on('connection', socket => {
          socket.broadcast.emit('a user connected')
          socket.on('hello', msg => {
            socket.emit('hello', 'world!')
          })

          socket.on('stats', async msg => {
            const currentLoad = await si.currentLoad();
            const mem = await si.mem();
            const cpu = await si.cpu()
            

            socket.emit('stats', JSON.stringify({
                cores: cpu.physicalCores,
                cpuGovernor: cpu.governor,
                perfCores: cpu.performanceCores,
                effiCores: cpu.efficiencyCores,
                cpuUsage: currentLoad.currentLoad,
                ramActive: mem.active,
                ramTotal: mem.total,
                ramAvailable: mem.available,
                ramUsed: mem.used,
                ramCache: mem.cached,
                ramFree: mem.free,
                swapUsed: mem.swapused,
                swapTotal: mem.swaptotal,
            }))
          })
        });
    
        (res.socket as any).server.io = io
    }

    /*const currentLoad = await si.currentLoad()
    return res.status(200).json({
        cpuUsage: currentLoad.currentLoad
    })*/
    return res.end()
}