// import { ReactNode } from 'react'
// import { ModelSelector } from 'src/components/Model/ModelSelector'


// function ModelButton() {
//     const mutation = useMutation({
//         mutationFn: async (data: { text: string; role: Role } | null) => {
//           const text = data?.text ?? null
//           const role = data?.role ?? 'user'

//           const parentKey = storageKey(props.nodeId)
//           const parent = await ikv.get(parentKey)
//           if (!parent) {
//             throw new Error('Parent node not found')
//           }

//           async function addNode(message: ThreadNode['message'], response?: any) {
//             const id = String(ObjectID())
//             const node: ThreadNode = {
//               depth: parent.depth + 1,
//               children: [],
//               message: message,
//               response,
//               timestamp: new Date().toJSON(),
//             }
//             await ikv.set(storageKey(id), node)
//             parent.children.unshift(id)
//           }

//           if (text === null) {
//             let secretKey = await ikv.get('openaiSecretKey')
//             if (!secretKey) {
//               secretKey = prompt('Enter OpenAI secret key')
//               if (!secretKey) {
//                 throw new Error('OpenAI secret key is required')
//               }
//               await ikv.set('openaiSecretKey', secretKey)
//               queryClient.invalidateQueries(['models'])
//             }

//             const response = await createChatCompletion(nextMessages, secretKey)
//             for (const [index, choice] of response.data.choices.entries()) {
//               await addNode(choice.message, {
//                 data: response.data,
//                 index,
//               })
//             }
//           } else {
//             if (!text.trim()) {
//               throw new Error('Message cannot be empty')
//             }
//             await addNode({ role: role, content: text })
//           }
//           await ikv.set(parentKey, parent)
//           query.refetch()
//         },
//       })

//   return (
//         <>
//             <div className="btn-group btn-sm">
//               <button
//                 className="btn btn-success"
//                 onClick={() => mutation.mutate(null)}
//                 disabled={mutation.isLoading}
//               >
//                 {mutation.isLoading
//                   ? 'Please wait…'
//                   : data.children.length > 0
//                   ? 'Generate another reply'
//                   : 'Generate a reply'}
//               </button>
//               <button 
//                 type="button" 
//                 className="btn btn-sm btn-success dropdown-toggle dropdown-toggle-split" 
//                 data-bs-toggle="dropdown" 
//                 aria-expanded="false" 
//                 data-bs-reference="parent"
//               />
//               <form className="dropdown-menu dropdown-menu-lg-start p-2" style={{ width: "fit-content" }}>
//                 <div className="input-group input-group-sm">
//                   <span className="input-group-text" style={{ width: "60%" }}>Temperature</span>
//                   <input id="temperature" type="number" defaultValue={temperatureParam} min={0} max={1} step={0.1} 
//                     onChange={(e) => {
//                       setTemperature(convertToNumber(e.target.value))
//                     }
//                   } 
//                     className="form-control"
//                     />
//                 </div>
//                 <div className="input-group input-group-sm pt-2">
//                   <span className="input-group-text" style={{ width: "60%" }}>Top_P</span>
//                   <input id="top_p" type="number" defaultValue={topPParam} min={0} max={1} step={0.1} 
//                     onChange={(e) => {
//                       setTopP(convertToNumber(e.target.value))
//                       }
//                     } className="form-control"/>
//                 </div>
//                 <ModelSelector disabled={mutation.isLoading} />
//               </form>
//             </div>
//         </>
//   )
// }

// export {
//     ModelButton
// }