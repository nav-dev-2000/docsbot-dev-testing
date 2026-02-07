export default function QuestionSkeleton() {
  return (<>
     <tr className="animate-pulse">
       <td className="hidden py-4 pl-2 pr-2 text-sm lg:table-cell">
         <div className="flex items-center">
           <div className="h-9 w-9 rounded-full bg-gray-200"></div>
           <div className="ml-3 h-4 w-20 rounded bg-gray-200"></div>
         </div>
       </td>
       <td className="px-3 py-4 text-sm sm:pl-0 lg:table-cell">
         <div className="space-y-2">
           <div className="h-4 w-3/4 rounded bg-gray-200"></div>
           <div className="h-3 w-1/2 rounded bg-gray-100"></div>
         </div>
       </td>
       <td className="hidden px-3 py-4 text-sm lg:table-cell">
         <div className="space-y-2">
           <div className="h-4 w-full rounded bg-gray-200"></div>
           <div className="h-4 w-5/6 rounded bg-gray-200"></div>
         </div>
       </td>
       <td className="hidden px-3 py-4 text-sm lg:table-cell">
         <div className="h-4 w-24 rounded bg-gray-200"></div>
       </td>
       <td className="hidden px-3 py-4 text-sm lg:table-cell">
         <div className="h-6 w-10 rounded bg-gray-200"></div>
       </td>
       <td className="hidden px-3 py-4 text-sm lg:table-cell">
         <div className="h-6 w-6 rounded bg-gray-200"></div>
       </td>
     </tr>
    </>
  )
}