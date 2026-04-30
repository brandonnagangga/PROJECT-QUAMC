<div class="file-label">FILE: {{ $file['original_filename'] }}</div>

@if($file['is_pdf'])
    @if(!empty($file['pdf_pages']))
        @foreach($file['pdf_pages'] as $page)
            <div class="pdf-page-wrap {{ $loop->first ? 'first-pdf-page' : '' }}">
                @if(count($file['pdf_pages']) > 1)
                    <div class="pdf-page-label">Page {{ $page['page'] }}</div>
                @endif
                <img src="{{ $page['image_data'] }}" />
            </div>
        @endforeach
    @else
        <div class="not-extractable">[PDF preview unavailable]</div>
    @endif
@elseif($file['extracted_text'])
    <div style="white-space: pre-wrap; font-size: 8pt; line-height: 1.35;">
        {{ $file['extracted_text'] }}
    </div>
@elseif(!$file['is_image'])
    <div class="not-extractable">[Text extraction unavailable for this file type]</div>
@endif

@if($file['is_image'] && !empty($file['image_data']))
    <div class="img-wrap">
        <img src="{{ $file['image_data'] }}" />
    </div>
@endif
