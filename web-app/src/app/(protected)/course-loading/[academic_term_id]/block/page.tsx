const BlockPage = () => {
  return (

      <div className="text-start text-sm text-foreground/70 p-4 h-full flex-1 flex flex-col items-center justify-center border rounded-md">
        <p>
          Class management for block-aware will be rendered here (a component)
        </p>

        <p>
          This should be a component that holds a table.The table will have the
          following columns:
        </p>
        <ul className="list-disc list-inside mt-2 text-foreground/80">
          <li>Course (code)</li>
          <li>faculty (name)</li>
          <li>Laboratory (course.laboratory_unit x 3)h</li>
          <li>Lecture (course.lecture_unit)h</li>
          <li>Unit (laboratory_unit + lecture_unit)</li>
          <li>Merge (a class_block with the same class_id other than the current class_block)</li>
          <li>Edit Button</li>
          <li>Delete Button</li>
        </ul>

        <p> after the rows, /components/ui/add-tile will be rendered. when clicked, the components/course-loading/class-maker.tsx will show up.</p>

        <p>Below the table, Total Unit will be shown</p>
      </div>
      
      

  );
};

export default BlockPage;