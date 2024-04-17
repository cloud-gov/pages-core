<script>
  import { fetchTasks } from '../lib/api';
  import { PaginatedQueryPage, TaskTable } from '../components';

  const fields = {};
</script>

<PaginatedQueryPage path="tasks" query={fetchTasks} {fields} let:data>
  <TaskTable tasks={data} showSite={true} />
</PaginatedQueryPage>
