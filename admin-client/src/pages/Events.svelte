<script>
  import { fetchEvents } from '../lib/api';
  import { EventTable, PaginatedQueryPage } from '../components';

  const fields = {
    type: {
      type: 'select',
      options: (meta) => meta.eventTypes.map((type) => ({
        name: type,
        value: type,
      })),
    },
    label: {
      type: 'select',
      options: (meta) => meta.eventLabels.map((label) => ({
        name: label,
        value: label,
      })),
    },
    model: {
      type: 'select',
      options: (meta) => meta.models.map((model) => ({
        name: model,
        value: model,
      })),
    },
  };
</script>

<PaginatedQueryPage path="events" query={fetchEvents} {fields} let:data>
  <EventTable events={data}/>
</PaginatedQueryPage>
